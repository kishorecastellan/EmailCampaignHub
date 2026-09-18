import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
  GetCommand,
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

export const handler = async (event: {
  arguments?: {
    contactId?: string;
    campaignId?: string;
    email?: string;
    action?: string;
  };
}) => {
  const contactId = event.arguments?.contactId?.trim();
  const campaignId = event.arguments?.campaignId?.trim() || "";
  const email = event.arguments?.email?.trim() || "";
  const action = (event.arguments?.action || "").trim().toLowerCase();

  if (!contactId) {
    throw new Error("Missing required field: contactId");
  }
  if (action !== "subscribe" && action !== "unsubscribe") {
    throw new Error("action must be subscribe or unsubscribe");
  }

  const tables = await resolveTableNames();
  const now = new Date().toISOString();
  const subscription = action === "subscribe" ? "Subscribed" : "Unsubscribed";
  const status = action === "subscribe" ? "ACTIVE" : "INACTIVE";
  const eventType = action === "subscribe" ? "SUBSCRIBE" : "UNSUBSCRIBE";

  const existing = await ddb.send(
    new GetCommand({
      TableName: tables.contact,
      Key: { id: contactId },
    })
  );

  if (!existing.Item) {
    throw new Error("Contact not found");
  }

  await ddb.send(
    new UpdateCommand({
      TableName: tables.contact,
      Key: { id: contactId },
      UpdateExpression:
        "SET #subscription = :subscription, #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#subscription": "subscription",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":subscription": subscription,
        ":status": status,
        ":updatedAt": now,
      },
    })
  );

  const eventId = `${campaignId || "none"}#${contactId}#${eventType}`;
  let created = true;
  try {
    await ddb.send(
      new PutCommand({
        TableName: tables.engagement,
        Item: {
          id: eventId,
          campaignId: campaignId || "none",
          contactId,
          email: email || existing.Item.email || undefined,
          eventType,
          eventAt: now,
          metadata: { source: "preference-link" },
          createdAt: now,
          updatedAt: now,
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
      created = false;
    } else {
      throw error;
    }
  }

  if (created && campaignId) {
    const counterField =
      eventType === "SUBSCRIBE" ? "subscribedCount" : "unsubscribedCount";
    await ddb.send(
      new UpdateCommand({
        TableName: tables.campaign,
        Key: { id: campaignId },
        UpdateExpression: `ADD ${counterField} :one SET updatedAt = :updatedAt`,
        ExpressionAttributeValues: {
          ":one": 1,
          ":updatedAt": now,
        },
      })
    );
  }

  return JSON.stringify({
    status: "ok",
    action,
    contactId,
    subscription,
  });
};
