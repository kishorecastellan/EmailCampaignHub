import { defineFunction } from "@aws-amplify/backend";

export const campaignWorker = defineFunction({
  name: "email-campaign-hub-campaign-worker",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  environment: {
    SES_FROM_EMAIL:
      process.env.SES_FROM_EMAIL ?? "emailtookishore@gmail.com",
  },
});
