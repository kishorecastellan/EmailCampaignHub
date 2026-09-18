import { defineFunction } from "@aws-amplify/backend";

export const createSesTemplate = defineFunction({
  name: "email-campaign-hub-create-ses-template",
  entry: "./handler.ts",
});
