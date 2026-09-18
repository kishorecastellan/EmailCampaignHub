import {
  SESClient,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
} from "@aws-sdk/client-ses";

const ses = new SESClient();

function toSesTemplateName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export const handler = async (event: any) => {
  const fieldName = event?.info?.fieldName ?? event?.fieldName ?? "createSesTemplate";
  const { templateName, subject, htmlContent } = event.arguments ?? {};

  if (!templateName) {
    throw new Error("Missing required field: templateName");
  }

  const sesTemplateName = toSesTemplateName(templateName);
  if (!sesTemplateName) {
    throw new Error(
      "Template name must include letters, numbers, '_' or '-' for SES."
    );
  }

  try {
    if (fieldName === "deleteSesTemplate") {
      await ses.send(
        new DeleteTemplateCommand({ TemplateName: sesTemplateName })
      );
      return `Successfully deleted SES template: ${sesTemplateName}`;
    }

    if (!htmlContent) {
      throw new Error("Missing required field: htmlContent");
    }

    const template = {
      TemplateName: sesTemplateName,
      SubjectPart: subject || "No Subject",
      HtmlPart: htmlContent,
    };

    if (fieldName === "updateSesTemplate") {
      await ses.send(new UpdateTemplateCommand({ Template: template }));
      return `Successfully updated SES template: ${sesTemplateName}`;
    }

    await ses.send(new CreateTemplateCommand({ Template: template }));
    return `Successfully created SES template: ${sesTemplateName}`;
  } catch (error: any) {
    console.error("SES Template Error", error);
    throw new Error(`Failed to manage SES template: ${error.message}`);
  }
};
