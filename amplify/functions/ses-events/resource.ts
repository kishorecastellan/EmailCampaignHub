import { defineFunction } from "@aws-amplify/backend";

export const sesEvents = defineFunction({
  name: "email-campaign-hub-ses-events",
  entry: "./handler.ts",
  timeoutSeconds: 60,
});
