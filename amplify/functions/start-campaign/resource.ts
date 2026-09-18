import { defineFunction } from "@aws-amplify/backend";

export const startCampaign = defineFunction({
  name: "email-campaign-hub-start-campaign",
  entry: "./handler.ts",
  timeoutSeconds: 120,
  environment: {
    DIRECT_SEND_MAX: "25",
    SES_FROM_EMAIL:
      process.env.SES_FROM_EMAIL ?? "emailtookishore@gmail.com",
  },
});
