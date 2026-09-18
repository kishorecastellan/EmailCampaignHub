import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { createSesTemplate } from './functions/create-ses-template/resource.js';
import { startCampaign } from './functions/start-campaign/resource.js';
import { campaignWorker } from './functions/campaign-worker/resource.js';
import { sesEvents } from './functions/ses-events/resource.js';
import { updateSubscription } from './functions/update-subscription/resource.js';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration, Stack } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {
  CloudWatchDimensionSource,
  ConfigurationSet,
  EmailSendingEvent,
  EventDestination,
} from 'aws-cdk-lib/aws-ses';

const backend = defineBackend({
  auth,
  data,
  createSesTemplate,
  startCampaign,
  campaignWorker,
  sesEvents,
  updateSubscription,
});

backend.createSesTemplate.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "ses:CreateTemplate",
      "ses:UpdateTemplate",
      "ses:DeleteTemplate",
    ],
    resources: ["*"],
  })
);

const tables = backend.data.resources.tables;
const campaignTable = tables["Campaign"];
const segmentTable = tables["Segment"];
const contactTable = tables["Contact"];
const templateTable = tables["EmailTemplateMetadata"];
const engagementTable = tables["EmailEngagementEvent"];

const dataStack = Stack.of(campaignTable);
const tableParamsPrefix = "/email-campaign-hub/sandbox/tables";

new StringParameter(dataStack, "CampaignTableNameParam", {
  parameterName: `${tableParamsPrefix}/campaign`,
  stringValue: campaignTable.tableName,
});
new StringParameter(dataStack, "SegmentTableNameParam", {
  parameterName: `${tableParamsPrefix}/segment`,
  stringValue: segmentTable.tableName,
});
new StringParameter(dataStack, "ContactTableNameParam", {
  parameterName: `${tableParamsPrefix}/contact`,
  stringValue: contactTable.tableName,
});
new StringParameter(dataStack, "TemplateTableNameParam", {
  parameterName: `${tableParamsPrefix}/template`,
  stringValue: templateTable.tableName,
});
new StringParameter(dataStack, "EngagementTableNameParam", {
  parameterName: `${tableParamsPrefix}/engagement`,
  stringValue: engagementTable.tableName,
});

const functionStack = Stack.of(backend.startCampaign.resources.lambda);
const campaignQueue = new Queue(functionStack, "CampaignQueue", {
  visibilityTimeout: Duration.seconds(90),
});

const sesConfigurationSetName = "email-campaign-hub";
const sesConfigurationSet = new ConfigurationSet(functionStack, "CampaignSesConfigurationSet", {
  configurationSetName: sesConfigurationSetName,
  reputationMetrics: true,
  sendingEnabled: true,
});

const sesEventsTopic = new Topic(functionStack, "CampaignSesEventsTopic", {
  displayName: "Email Campaign Hub SES Events",
  topicName: "email-campaign-hub-ses-events",
});

const trackedEvents = [
  EmailSendingEvent.SEND,
  EmailSendingEvent.DELIVERY,
  EmailSendingEvent.BOUNCE,
  EmailSendingEvent.COMPLAINT,
  EmailSendingEvent.REJECT,
  EmailSendingEvent.RENDERING_FAILURE,
  EmailSendingEvent.OPEN,
  EmailSendingEvent.CLICK,
];

sesConfigurationSet.addEventDestination("CloudWatchMetrics", {
  configurationSetEventDestinationName: "cloudwatch-metrics",
  destination: EventDestination.cloudWatchDimensions([
    {
      name: "campaignId",
      source: CloudWatchDimensionSource.MESSAGE_TAG,
      defaultValue: "none",
    },
    {
      name: "contactId",
      source: CloudWatchDimensionSource.MESSAGE_TAG,
      defaultValue: "none",
    },
  ]),
  events: trackedEvents,
});

sesConfigurationSet.addEventDestination("SnsEvents", {
  configurationSetEventDestinationName: "sns-events",
  destination: EventDestination.snsTopic(sesEventsTopic),
  events: trackedEvents,
});

backend.startCampaign.addEnvironment("CAMPAIGN_QUEUE_URL", campaignQueue.queueUrl);
backend.startCampaign.addEnvironment("TABLE_PARAMS_PREFIX", tableParamsPrefix);
backend.startCampaign.addEnvironment(
  "SES_CONFIGURATION_SET",
  sesConfigurationSet.configurationSetName
);
backend.startCampaign.addEnvironment(
  "APP_BASE_URL",
  process.env.APP_BASE_URL || "http://localhost:3000"
);
backend.campaignWorker.addEnvironment(
  "SES_CONFIGURATION_SET",
  sesConfigurationSet.configurationSetName
);
backend.campaignWorker.addEnvironment(
  "APP_BASE_URL",
  process.env.APP_BASE_URL || "http://localhost:3000"
);
backend.sesEvents.addEnvironment("TABLE_PARAMS_PREFIX", tableParamsPrefix);
backend.updateSubscription.addEnvironment("TABLE_PARAMS_PREFIX", tableParamsPrefix);

campaignQueue.grantSendMessages(backend.startCampaign.resources.lambda);

backend.startCampaign.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:UpdateItem",
    ],
    resources: ["*"],
  })
);
backend.startCampaign.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ssm:GetParameter", "ssm:GetParameters"],
    resources: ["*"],
  })
);
backend.startCampaign.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ses:SendEmail", "ses:SendTemplatedEmail"],
    resources: ["*"],
  })
);

backend.campaignWorker.resources.lambda.addEventSource(
  new SqsEventSource(campaignQueue, {
    batchSize: 5,
    reportBatchItemFailures: true,
  })
);
backend.campaignWorker.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ses:SendEmail", "ses:SendTemplatedEmail"],
    resources: ["*"],
  })
);

backend.sesEvents.resources.lambda.addEventSource(
  new SnsEventSource(sesEventsTopic)
);
backend.sesEvents.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
    ],
    resources: ["*"],
  })
);
backend.sesEvents.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ssm:GetParameter", "ssm:GetParameters"],
    resources: ["*"],
  })
);

backend.updateSubscription.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
    ],
    resources: ["*"],
  })
);
backend.updateSubscription.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ssm:GetParameter", "ssm:GetParameters"],
    resources: ["*"],
  })
);
