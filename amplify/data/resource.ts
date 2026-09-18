import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { createSesTemplate } from "../functions/create-ses-template/resource.js";
import { startCampaign } from "../functions/start-campaign/resource.js";
import { updateSubscription } from "../functions/update-subscription/resource.js";

const schema = a.schema({
  createSesTemplate: a
    .mutation()
    .arguments({
      templateName: a.string().required(),
      subject: a.string(),
      htmlContent: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(createSesTemplate))
    .authorization((allow) => [allow.authenticated()]),

  updateSesTemplate: a
    .mutation()
    .arguments({
      templateName: a.string().required(),
      subject: a.string(),
      htmlContent: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(createSesTemplate))
    .authorization((allow) => [allow.authenticated()]),

  deleteSesTemplate: a
    .mutation()
    .arguments({
      templateName: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(createSesTemplate))
    .authorization((allow) => [allow.authenticated()]),

  startCampaign: a
    .mutation()
    .arguments({
      campaignId: a.string().required(),
      segmentId: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(startCampaign))
    .authorization((allow) => [allow.authenticated()]),

  updateSubscriptionPreference: a
    .mutation()
    .arguments({
      contactId: a.string().required(),
      campaignId: a.string(),
      email: a.string(),
      action: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(updateSubscription))
    .authorization((allow) => [
      allow.publicApiKey(),
      allow.authenticated(),
    ]),

  Campaign: a
    .model({
      name: a.string().required(),
      description: a.string(),
      status: a.string().required(),
      templateId: a.string(),
      segmentId: a.string(),
      subject: a.string(),
      scheduledAt: a.datetime(),
      sentCount: a.integer().default(0),
      deliveredCount: a.integer().default(0),
      openedCount: a.integer().default(0),
      clickedCount: a.integer().default(0),
      bouncedCount: a.integer().default(0),
      complainedCount: a.integer().default(0),
      unsubscribedCount: a.integer().default(0),
      subscribedCount: a.integer().default(0),
    })
    .authorization((allow) => [allow.authenticated()]),

  Segment: a
    .model({
      name: a.string().required(),
      description: a.string(),
      criteria: a.json(),
    })
    .authorization((allow) => [allow.authenticated()]),

  Contact: a
    .model({
      name: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      companyName: a.string(),
      email: a.string().required(),
      phone: a.string(),
      phoneCountryCode: a.string(),
      subscription: a.string(),
      marketingContact: a.string(),
      status: a.string(),
      attributes: a.json(),
    })
    .authorization((allow) => [allow.authenticated()]),

  ContactGroup: a
    .model({
      name: a.string().required(),
      description: a.string(),
      contactIds: a.string().array(),
    })
    .authorization((allow) => [allow.authenticated()]),

  EmailTemplateMetadata: a
    .model({
      templateName: a.string().required(),
      subject: a.string(),
      sesTemplateName: a.string().required(),
      htmlContent: a.string(),
      description: a.string(),
    })
    .authorization((allow) => [allow.authenticated()]),

  EmailEngagementEvent: a
    .model({
      campaignId: a.string().required(),
      contactId: a.string(),
      email: a.string(),
      eventType: a.string().required(),
      linkUrl: a.string(),
      sesMessageId: a.string(),
      eventAt: a.datetime(),
      metadata: a.json(),
    })
    .secondaryIndexes((index) => [
      index("campaignId")
        .sortKeys(["eventAt"])
        .queryField("listEngagementByCampaign"),
      index("eventType")
        .sortKeys(["eventAt"])
        .queryField("listEngagementByType"),
    ])
    .authorization((allow) => [
      allow.authenticated(),
      allow.publicApiKey().to(["read"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
