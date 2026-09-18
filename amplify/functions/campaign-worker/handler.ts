import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({});

type QueuePayload = {
  campaignId?: string;
  contactId?: string;
  email?: string;
  contactName?: string;
  firstName?: string;
  subject?: string;
  htmlContent?: string;
  sourceEmail?: string;
};

function renderHtml(html: string, values: Record<string, string>): string {
  let output = html;
  for (const [key, value] of Object.entries(values)) {
    output = output.split(`{{${key}}}`).join(value);
  }
  return output.replace(/\{\{[^}]+\}\}/g, "");
}

function buildUnsubscribeUrl(payload: QueuePayload): string {
  const base = (process.env.APP_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const params = new URLSearchParams({
    contactId: payload.contactId || "",
    campaignId: payload.campaignId || "",
    email: payload.email || "",
    action: "unsubscribe",
  });
  return `${base}/unsubscribe?${params.toString()}`;
}

function withUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const subscribeUrl = unsubscribeUrl.replace(
    "action=unsubscribe",
    "action=subscribe"
  );
  const footer = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 12px"/><p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;text-align:center">You are receiving this email because you are subscribed to our updates.<br/><a href="${unsubscribeUrl}" style="color:#0f766e">Unsubscribe</a> &nbsp;|&nbsp; <a href="${subscribeUrl}" style="color:#0f766e">Manage subscription</a></p>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return `${html}${footer}`;
}

export const handler = async (event: {
  Records: Array<{ body: string; messageId?: string }>;
}) => {
  const failures: Array<{ itemIdentifier: string }> = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body) as QueuePayload;
      const email = payload.email?.trim();
      const htmlContent = payload.htmlContent?.trim();
      const subject = payload.subject?.trim() || "Campaign update";
      const sourceEmail =
        payload.sourceEmail?.trim() ||
        (process.env.SES_FROM_EMAIL || "").trim();

      if (!email || !htmlContent || !sourceEmail) {
        throw new Error("Missing email, htmlContent, or sourceEmail in queue message");
      }

      const firstName = payload.firstName || payload.contactName || "there";
      const unsubscribeUrl = buildUnsubscribeUrl(payload);
      const rendered = renderHtml(htmlContent, {
        name: payload.contactName || firstName,
        firstName,
        email,
        campaignName: subject,
        headline: subject,
        introMessage: `Hi ${firstName},`,
        mainMessage: "",
        senderName: "Email Campaign Hub",
        companyName: "Email Campaign Hub",
        currentYear: String(new Date().getFullYear()),
        unsubscribeUrl,
      });
      const html = withUnsubscribeFooter(rendered, unsubscribeUrl);

      const configurationSetName = (
        process.env.SES_CONFIGURATION_SET || ""
      ).trim();

      await ses.send(
        new SendEmailCommand({
          Source: sourceEmail,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: html, Charset: "UTF-8" },
            },
          },
          ...(configurationSetName
            ? { ConfigurationSetName: configurationSetName }
            : {}),
          Tags: [
            { Name: "campaignId", Value: payload.campaignId || "none" },
            { Name: "contactId", Value: payload.contactId || "none" },
          ],
        })
      );

      console.log(
        `Sent campaign ${payload.campaignId} email to ${payload.contactId} (${email})`
      );
    } catch (error) {
      console.error("Campaign worker send failed", error);
      if (record.messageId) {
        failures.push({ itemIdentifier: record.messageId });
      } else {
        throw error;
      }
    }
  }

  return { batchItemFailures: failures };
};
