import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ssm = new SSMClient({});

type TableNames = {
  campaign: string;
  contact: string;
  engagement: string;
};

let cachedTables: TableNames | null = null;

async function resolveTableNames(): Promise<TableNames> {
  if (cachedTables) return cachedTables;

  if (
    process.env.CAMPAIGN_TABLE_NAME &&
    process.env.CONTACT_TABLE_NAME &&
    process.env.ENGAGEMENT_TABLE_NAME
  ) {
    cachedTables = {
      campaign: process.env.CAMPAIGN_TABLE_NAME,
      contact: process.env.CONTACT_TABLE_NAME,
      engagement: process.env.ENGAGEMENT_TABLE_NAME,
    };
    return cachedTables;
  }

  const prefix =
    process.env.TABLE_PARAMS_PREFIX || "/email-campaign-hub/sandbox/tables";
  const names = ["campaign", "contact", "engagement"] as const;
  const result = await ssm.send(
    new GetParametersCommand({
      Names: names.map((name) => `${prefix}/${name}`),
    })
  );

  const byName = new Map(
    (result.Parameters || []).map((parameter) => [
      parameter.Name || "",
      parameter.Value || "",
    ])
  );

  const tables = {
    campaign: byName.get(`${prefix}/campaign`) || "",
    contact: byName.get(`${prefix}/contact`) || "",
    engagement: byName.get(`${prefix}/engagement`) || "",
  };

  if (!tables.campaign || !tables.contact || !tables.engagement) {
    throw new Error("Could not resolve DynamoDB table names from SSM");
  }

  cachedTables = tables;
  return tables;
}

function firstTag(
  tags: Record<string, string[]> | undefined,
  name: string
): string {
  const values = tags?.[name];
  if (!values?.length) return "";
  return values[0] || "";
}

function normalizeEventType(raw: string): string {
  return String(raw || "")
    .trim()
    .toUpperCase();
}

function counterFieldForEvent(eventType: string): string | null {
  switch (eventType) {
    case "SEND":
      return "sentCount";
    case "DELIVERY":
      return "deliveredCount";
    case "OPEN":
      return "openedCount";
    case "CLICK":
      return "clickedCount";
    case "BOUNCE":
      return "bouncedCount";
    case "COMPLAINT":
      return "complainedCount";
    case "UNSUBSCRIBE":
      return "unsubscribedCount";
    case "SUBSCRIBE":
      return "subscribedCount";
    default:
      return null;
  }
}

async function recordUniqueEvent(params: {
  engagementTable: string;
  campaignTable: string;
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  eventType: string;
  linkUrl?: string;
  sesMessageId?: string;
  eventAt: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await ddb.send(
      new PutCommand({
        TableName: params.engagementTable,
        Item: {
          id: params.id,
          campaignId: params.campaignId || "none",
          contactId: params.contactId || undefined,
          email: params.email || undefined,
          eventType: params.eventType,
          linkUrl: params.linkUrl || undefined,
          sesMessageId: params.sesMessageId || undefined,
          eventAt: params.eventAt,
          metadata: params.metadata || undefined,
          createdAt: params.eventAt,
          updatedAt: params.eventAt,
          __typename: "EmailEngagementEvent",
        },
        ConditionExpression: "attribute_not_exists(id)",
      })
    );
  } catch (error: unknown) {
    const name =
      error && typeof error === "object" && "name" in error
        ? String((error as { name?: string }).name)
        : "";
    if (name === "ConditionalCheckFailedException") {
      return false;
    }
    throw error;
  }

  const counterField = counterFieldForEvent(params.eventType);
  if (counterField && params.campaignId && params.campaignId !== "none") {
    await ddb.send(
      new UpdateCommand({
        TableName: params.campaignTable,
        Key: { id: params.campaignId },
        UpdateExpression: `ADD ${counterField} :one SET updatedAt = :updatedAt`,
        ExpressionAttributeValues: {
          ":one": 1,
          ":updatedAt": params.eventAt,
        },
      })
    );
  }

  return true;
}

async function markContactUnsubscribed(
  contactTable: string,
  contactId: string,
  email: string
) {
  const now = new Date().toISOString();
  if (contactId) {
    await ddb.send(
      new UpdateCommand({
        TableName: contactTable,
        Key: { id: contactId },
        UpdateExpression:
          "SET #subscription = :subscription, #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#subscription": "subscription",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":subscription": "Unsubscribed",
          ":status": "INACTIVE",
          ":updatedAt": now,
        },
      })
    );
    return;
  }

  if (!email) return;
}

function parseSesPayload(body: string): Record<string, unknown> | null {
  let parsed: unknown = JSON.parse(body);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  if (obj.Type === "SubscriptionConfirmation" && typeof obj.SubscribeURL === "string") {
    console.log("SNS subscription confirmation required", obj.SubscribeURL);
    return null;
  }
  if (typeof obj.Message === "string") {
    return JSON.parse(obj.Message) as Record<string, unknown>;
  }
  return obj;
}

export const handler = async (event: {
  Records: Array<{ Sns?: { Message?: string }; body?: string }>;
}) => {
  const tables = await resolveTableNames();

  for (const record of event.Records) {
    const raw = record.Sns?.Message || record.body;
    if (!raw) continue;

    const payload = parseSesPayload(raw);
    if (!payload) continue;

    const eventType = normalizeEventType(
      String(payload.eventType || payload.notificationType || "")
    );
    if (!eventType) continue;

    const mail = (payload.mail || {}) as {
      messageId?: string;
      timestamp?: string;
      tags?: Record<string, string[]>;
      destination?: string[];
      commonHeaders?: { to?: string[] };
    };

    const campaignId = firstTag(mail.tags, "campaignId");
    const contactId = firstTag(mail.tags, "contactId");
    const email =
      mail.destination?.[0] ||
      mail.commonHeaders?.to?.[0] ||
      "";
    const eventAt =
      (typeof (payload as { open?: { timestamp?: string } }).open?.timestamp ===
      "string"
        ? (payload as { open?: { timestamp?: string } }).open?.timestamp
        : undefined) ||
      (typeof (payload as { click?: { timestamp?: string } }).click
        ?.timestamp === "string"
        ? (payload as { click?: { timestamp?: string } }).click?.timestamp
        : undefined) ||
      (typeof (payload as { delivery?: { timestamp?: string } }).delivery
        ?.timestamp === "string"
        ? (payload as { delivery?: { timestamp?: string } }).delivery?.timestamp
        : undefined) ||
      mail.timestamp ||
      new Date().toISOString();

    const click = payload.click as { link?: string } | undefined;
    const linkUrl = click?.link || undefined;
    const sesMessageId = mail.messageId || "unknown";

    let eventId = `${sesMessageId}#${eventType}`;
    if (eventType === "OPEN" && campaignId && contactId) {
      eventId = `${campaignId}#${contactId}#OPEN`;
    } else if (eventType === "CLICK" && campaignId && contactId) {
      eventId = `${campaignId}#${contactId}#CLICK#${encodeURIComponent(linkUrl || "link")}`;
    } else if (eventType === "DELIVERY" && campaignId && contactId) {
      eventId = `${campaignId}#${contactId}#DELIVERY`;
    }

    const created = await recordUniqueEvent({
      engagementTable: tables.engagement,
      campaignTable: tables.campaign,
      id: eventId,
      campaignId,
      contactId,
      email,
      eventType,
      linkUrl,
      sesMessageId,
      eventAt,
      metadata: {
        source: "ses",
      },
    });

    if (
      created &&
      (eventType === "COMPLAINT" || eventType === "BOUNCE")
    ) {
      await markContactUnsubscribed(tables.contact, contactId, email);
      if (eventType === "COMPLAINT") {
        await recordUniqueEvent({
          engagementTable: tables.engagement,
          campaignTable: tables.campaign,
          id: `${campaignId || "none"}#${contactId || email}#UNSUBSCRIBE`,
          campaignId,
          contactId,
          email,
          eventType: "UNSUBSCRIBE",
          sesMessageId,
          eventAt,
          metadata: { reason: "complaint" },
        });
      }
    }

    console.log(
      `Processed SES ${eventType} campaign=${campaignId} contact=${contactId} created=${created}`
    );
  }

  return { ok: true };
};
