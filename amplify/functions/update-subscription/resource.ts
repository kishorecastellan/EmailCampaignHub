import { defineFunction } from "@aws-amplify/backend";

export const updateSubscription = defineFunction({
  name: "email-campaign-hub-update-subscription",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
