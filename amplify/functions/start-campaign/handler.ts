import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sqs = new SQSClient({});
const ses = new SESClient({});
const ssm = new SSMClient({});

const DIRECT_SEND_MAX = Number(process.env.DIRECT_SEND_MAX || "25");

type ContactRecord = {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  subscription?: string;
  status?: string;
};

type QueuePayload = {
  campaignId: string;
  contactId: string;
  email: string;
  contactName: string;
  firstName: string;
  subject: string;
  htmlContent: string;
  sourceEmail: string;
};

type TableNames = {
  campaign: string;
  segment: string;
  contact: string;
  template: string;
};

let cachedTables: TableNames | null = null;

async function resolveTableNames(): Promise<TableNames> {
  if (cachedTables) return cachedTables;

  if (
    process.env.CAMPAIGN_TABLE_NAME &&
    process.env.SEGMENT_TABLE_NAME &&
    process.env.CONTACT_TABLE_NAME &&
    process.env.TEMPLATE_TABLE_NAME
  ) {
    cachedTables = {
      campaign: process.env.CAMPAIGN_TABLE_NAME,
      segment: process.env.SEGMENT_TABLE_NAME,
      contact: process.env.CONTACT_TABLE_NAME,
      template: process.env.TEMPLATE_TABLE_NAME,
    };
    return cachedTables;
  }

  const prefix = process.env.TABLE_PARAMS_PREFIX || "/email-campaign-hub/sandbox/tables";
  const names = ["campaign", "segment", "contact", "template"] as const;
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
    segment: byName.get(`${prefix}/segment`) || "",
    contact: byName.get(`${prefix}/contact`) || "",
    template: byName.get(`${prefix}/template`) || "",
  };

  if (!tables.campaign || !tables.segment || !tables.contact || !tables.template) {
    throw new Error("Could not resolve DynamoDB table names from SSM");
  }

  cachedTables = tables;
  return tables;
}

function parseContactIds(criteria: unknown): string[] {
  let value = criteria;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!value || typeof value !== "object") return [];
  const ids = (value as { contactIds?: unknown }).contactIds;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string" && Boolean(id));
}

function contactDisplayName(contact: ContactRecord): string {
  if (contact.name?.trim()) return contact.name.trim();
  const parts = [contact.firstName, contact.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.join(" ") || "there";
}

function contactFirstName(contact: ContactRecord): string {
  if (contact.firstName?.trim()) return contact.firstName.trim();
  const name = contactDisplayName(contact);
  return name.split(/\s+/)[0] || "there";
}

function renderHtml(
  html: string,
  values: Record<string, string>
): string {
  let output = html;
  for (const [key, value] of Object.entries(values)) {
    output = output.split(`{{${key}}}`).join(value);
  }
  return output.replace(/\{\{[^}]+\}\}/g, "");
}

function isSendableContact(contact: ContactRecord): boolean {
  const subscription = (contact.subscription || "").toLowerCase();
  const status = (contact.status || "").toLowerCase();
  if (subscription === "unsubscribed") return false;
  if (status === "inactive") return false;
  return Boolean(contact.email?.trim());
}

function buildUnsubscribeUrl(payload: QueuePayload): string {
  const base = (process.env.APP_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const params = new URLSearchParams({
    contactId: payload.contactId,
    campaignId: payload.campaignId,
    email: payload.email,
    action: "unsubscribe",
  });
  return `${base}/unsubscribe?${params.toString()}`;
}

function withUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const subscribeUrl = unsubscribeUrl.includes("action=")
    ? unsubscribeUrl.replace(/action=[^&]+/, "action=subscribe")
    : `${unsubscribeUrl}${unsubscribeUrl.includes("?") ? "&" : "?"}action=subscribe`;
  const footer = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 12px"/><p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;text-align:center">You are receiving this email because you are subscribed to our updates.<br/><a href="${unsubscribeUrl}" style="color:#0f766e">Unsubscribe</a> &nbsp;|&nbsp; <a href="${subscribeUrl}" style="color:#0f766e">Manage subscription</a></p>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return `${html}${footer}`;
}

async function getItem<T>(tableName: string, id: string): Promise<T | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  );
  return (result.Item as T) || null;
}

async function batchGetContacts(
  tableName: string,
  ids: string[]
): Promise<ContactRecord[]> {
  const contacts: ContactRecord[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const result = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: chunk.map((id) => ({ id })),
          },
        },
      })
    );
    const items = (result.Responses?.[tableName] || []) as ContactRecord[];
    contacts.push(...items);

    let unprocessed = result.UnprocessedKeys?.[tableName]?.Keys;
    while (unprocessed && unprocessed.length > 0) {
      const retry = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [tableName]: { Keys: unprocessed },
          },
        })
      );
      contacts.push(...((retry.Responses?.[tableName] || []) as ContactRecord[]));
      unprocessed = retry.UnprocessedKeys?.[tableName]?.Keys;
    }
  }
  return contacts;
}

async function updateCampaignStatus(
  tableName: string,
  campaignId: string,
  status: string
) {
  await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: campaignId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

async function sendCampaignEmail(payload: QueuePayload) {
  const rendered = renderHtml(payload.htmlContent, {
    name: payload.contactName,
    firstName: payload.firstName,
    email: payload.email,
    campaignName: payload.subject,
    headline: payload.subject,
    introMessage: `Hi ${payload.firstName},`,
    mainMessage: "",
    senderName: "Email Campaign Hub",
    companyName: "Email Campaign Hub",
    currentYear: String(new Date().getFullYear()),
    unsubscribeUrl: buildUnsubscribeUrl(payload),
  });
  const html = withUnsubscribeFooter(rendered, buildUnsubscribeUrl(payload));

  const configurationSetName = (process.env.SES_CONFIGURATION_SET || "").trim();

  await ses.send(
    new SendEmailCommand({
      Source: payload.sourceEmail,
      Destination: { ToAddresses: [payload.email] },
      Message: {
        Subject: { Data: payload.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
      ...(configurationSetName
        ? { ConfigurationSetName: configurationSetName }
        : {}),
      Tags: [
        { Name: "campaignId", Value: payload.campaignId },
        { Name: "contactId", Value: payload.contactId },
      ],
    })
  );
}

async function enqueuePayloads(payloads: QueuePayload[]) {
  const queueUrl = process.env.CAMPAIGN_QUEUE_URL;
  if (!queueUrl) {
    throw new Error("CAMPAIGN_QUEUE_URL is not configured");
  }

  for (let i = 0; i < payloads.length; i += 10) {
    const batch = payloads.slice(i, i + 10);
    const command = new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: batch.map((payload, index) => ({
        Id: `${i + index}`,
        MessageBody: JSON.stringify(payload),
      })),
    });
    const result = await sqs.send(command);
    if (result.Failed?.length) {
      throw new Error(
        `Failed to enqueue ${result.Failed.length} messages to SQS`
      );
    }
  }
}

export const handler = async (event: {
  arguments?: { campaignId?: string; segmentId?: string };
}) => {
  const campaignId = event.arguments?.campaignId;
  const segmentIdArg = event.arguments?.segmentId;

  if (!campaignId) {
    throw new Error("Missing required field: campaignId");
  }

  const sourceEmail = (process.env.SES_FROM_EMAIL || "").trim();
  if (!sourceEmail) {
    throw new Error(
      "SES_FROM_EMAIL is not set. Set a verified SES identity before sending."
    );
  }

  try {
    const tables = await resolveTableNames();

    const campaign = await getItem<{
      id?: string;
      status?: string;
      templateId?: string;
      segmentId?: string;
      subject?: string;
      name?: string;
    }>(tables.campaign, campaignId);

    if (!campaign?.id) {
      throw new Error("Campaign not found");
    }

    const segmentId = segmentIdArg || campaign.segmentId;
    if (!segmentId) {
      throw new Error("Campaign has no segment selected");
    }
    if (!campaign.templateId) {
      throw new Error("Campaign has no email template selected");
    }

    if (campaign.status === "SENDING") {
      throw new Error("Campaign is already sending");
    }

    const segment = await getItem<{ id?: string; criteria?: unknown }>(
      tables.segment,
      segmentId
    );
    if (!segment?.id) {
      throw new Error("Segment not found");
    }

    const contactIds = parseContactIds(segment.criteria);
    if (contactIds.length === 0) {
      throw new Error("Segment has no contacts");
    }

    const template = await getItem<{
      id?: string;
      sesTemplateName?: string;
      templateName?: string;
      subject?: string;
      htmlContent?: string;
    }>(tables.template, campaign.templateId);

    if (!template?.htmlContent?.trim()) {
      throw new Error("Email template HTML content not found");
    }

    const subject =
      campaign.subject?.trim() ||
      template.subject?.trim() ||
      campaign.name?.trim() ||
      "Campaign update";

    const contacts = await batchGetContacts(tables.contact, contactIds);
    const payloads: QueuePayload[] = contacts
      .filter(isSendableContact)
      .map((contact) => ({
        campaignId,
        contactId: contact.id || "",
        email: (contact.email || "").trim(),
        contactName: contactDisplayName(contact),
        firstName: contactFirstName(contact),
        subject,
        htmlContent: template.htmlContent as string,
        sourceEmail,
      }))
      .filter((payload) => Boolean(payload.contactId && payload.email));

    if (payloads.length === 0) {
      throw new Error("No contacts with valid email addresses in segment");
    }

    let markedSending = false;
    await updateCampaignStatus(tables.campaign, campaignId, "SENDING");
    markedSending = true;

    try {
      if (payloads.length <= DIRECT_SEND_MAX) {
        let sent = 0;
        for (const payload of payloads) {
          await sendCampaignEmail(payload);
          sent += 1;
        }
        await updateCampaignStatus(tables.campaign, campaignId, "SENT");
        return `Sent ${sent} emails successfully.`;
      }

      await enqueuePayloads(payloads);
      return `Queued ${payloads.length} emails for delivery.`;
    } catch (sendError) {
      if (markedSending) {
        await updateCampaignStatus(tables.campaign, campaignId, "FAILED");
      }
      throw sendError;
    }
  } catch (error: unknown) {
    console.error("StartCampaign Error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to start campaign: ${message}`);
  }
};
