Below is a professionally corrected and structured prompt you can paste directly into the **Antigravity Agent** to generate the implementation plan.

# Requirement: AWS Email Campaign Hub – Basic Campaign Functionality

Create a detailed, implementation-ready technical plan for building and deploying an **Email Campaign Hub** application using **AWS Amplify Gen 2 with Next.js**.

The generated plan will be used as the technical blueprint for implementing the project, so it should focus only on the requirements specified below and should not introduce unnecessary features, services, or infrastructure.

## 1. Existing Project Status

The following setup has already been completed:

* An **AWS Amplify Gen 2 sandbox environment** is already configured.
* A **starter AWS Amplify Gen 2 + Next.js application** has already been created and deployed to the sandbox.
* A **GitHub repository** is already being used as the source-code repository.
* AWS Amplify Hosting will be used for the application deployment and CI/CD.
* The plan should build upon the existing Amplify/Next.js starter project rather than creating a new project from scratch.

Do not recreate or replace the existing sandbox configuration unless required by the implementation.

---

# 2. Technology Stack

Use the following AWS and application technologies:

### Frontend

* Next.js
* TypeScript
* AWS Amplify Gen 2
* ShadCN/UI or equivalent reusable UI components

### Authentication

* Amazon Cognito

### API

* AWS AppSync / Amplify Data

### Compute

* AWS Lambda

### Email

* Amazon SES
* Amazon SES Email Templates
* HTML-based email templates

### Queueing

* Amazon SQS

### Database

* Amazon DynamoDB through Amplify Gen 2 / AppSync

### Deployment and CI/CD

* AWS Amplify Hosting
* GitHub repository
* GitHub → AWS Amplify CI/CD

---

# 3. Scope – Basic Functionality Only

The first version must contain only the following core functionality.

## Campaign Management

The application must provide UI and backend functionality for:

* Create Campaign
* View Campaign
* Edit Campaign
* Delete Campaign
* Campaign status
* Campaign name
* Campaign description/details
* Select email template
* Select segment
* Display estimated/selected contact count
* Campaign scheduling information where required for the basic implementation
* Campaign creation/update timestamps
* Basic campaign sending functionality

Do not implement advanced marketing automation, workflows, journeys, A/B testing, analytics dashboards, or other advanced campaign-management features.

---

# 4. Segment Management

Create a Segment management section with the following functionality:

* Create Segment
* View Segment
* Edit Segment
* Delete Segment
* Segment name
* Segment description
* Basic segment criteria/filtering
* Display the number of contacts matching the segment
* Allow a campaign to select a segment

The segment implementation should support selecting the appropriate contacts for a campaign.

Do not introduce advanced segmentation engines or unnecessary third-party services.

---

# 5. Contact Management

Create a Contacts management section with:

* Create Contact
* View Contact
* Edit Contact
* Delete Contact
* First name
* Last name
* Email address
* Basic contact attributes required for segmentation
* Contact status
* Suppression/unsubscribe-related status where required for safe email sending
* Created/updated timestamps

The architecture must support sending campaigns to **10,000+ contacts**.

Design the data model and sending architecture so that the frontend does not directly process thousands of contacts at once.

Use server-side processing, pagination, batching, and queue-based processing where appropriate.

---

# 6. SES Email Template Management

Create an Email Templates section with:

* Create SES Email Template
* View SES Email Template
* Edit SES Email Template
* Delete SES Email Template

The initial implementation must use **HTML code-based email templates**.

The user should be able to enter HTML code directly into the application UI.

Example flow:

1. User opens "Create Email Template".
2. User enters:

   * Template name
   * Template subject
   * HTML email content
3. User submits the form.
4. The backend validates the request.
5. Lambda calls Amazon SES.
6. The SES email template is created.
7. Template metadata is stored in the application's database if required.
8. The UI displays the created template.
9. User can later edit the HTML and update the SES template.
10. User can delete the SES template from the UI.

The initial version does **not** require a drag-and-drop email editor.

Do not implement Unlayer, GrapesJS, visual email builders, or other email-design editors in this version.

The architecture should allow a visual email editor to be added in a future version without requiring a major redesign.

---

# 7. Campaign Creation UI

Design a professional campaign creation interface similar to a basic Mailchimp-style campaign workflow.

The UI should contain appropriate reusable components such as:

* Campaign name input
* Campaign description
* Email template selector
* Segment selector
* Contact count
* Subject information
* Campaign configuration
* Basic scheduling information
* Save/Create Campaign button
* Edit Campaign functionality
* Delete Campaign confirmation dialog
* Campaign status
* Validation messages
* Loading states
* Success/error notifications

The campaign UI should be responsive and implemented using reusable Next.js/React components.

Do not over-engineer the UI.

---

# 8. Email Template UI

Create a dedicated email template interface containing:

* Template list
* Create Template button
* Template name
* Subject
* HTML editor/code input area
* Preview capability if practical without introducing unnecessary infrastructure
* Save/Create button
* Edit button
* Delete button
* Delete confirmation
* Validation
* Loading/error/success states

The HTML code entered by the user must ultimately be stored as an Amazon SES email template.

---

# 9. Image Upload and URL Links

The campaign/email-template functionality should support basic email content requirements:

### Images

Provide a basic image-upload capability where required for email content.

Use an appropriate AWS-native storage approach such as Amazon S3 only if required by the implementation.

Images should be referenced using URLs that can be used inside HTML email content.

### Links

Users must be able to include URLs/links inside the HTML email content.

Do not introduce an unnecessary media-management system.

Keep image handling simple and compatible with Amazon SES email delivery requirements.

---

# 10. Campaign Sending Architecture

The system must support campaigns targeting **10,000+ contacts**.

Design the sending architecture around asynchronous processing.

Expected high-level flow:

```text
User
  ↓
Next.js Campaign UI
  ↓
AppSync
  ↓
Lambda
  ↓
Campaign + Segment validation
  ↓
Retrieve eligible contacts
  ↓
SQS
  ↓
Lambda Worker
  ↓
Amazon SES
  ↓
Email Delivery
```

The architecture should:

* Avoid processing 10,000+ contacts directly in the browser.
* Avoid sending 10,000+ emails from a single synchronous API request.
* Use SQS for asynchronous queue processing.
* Process contacts in manageable batches.
* Use Lambda workers for SES sending.
* Handle Lambda/SQS retries appropriately.
* Avoid duplicate email sending where possible.
* Respect Amazon SES sending limits.
* Provide basic campaign status tracking.
* Allow failed messages to be retried.
* Use a dead-letter queue only if required and appropriate.
* Keep the implementation simple enough for the first version.

The plan must clearly explain how 10,000+ contacts will be processed safely and asynchronously.

---

# 11. Data Model

Create an appropriate Amplify Gen 2 data model for at least:

### Campaign

Suggested fields:

* id
* name
* description
* status
* templateId
* segmentId
* subject
* scheduledAt
* createdAt
* updatedAt

### Segment

Suggested fields:

* id
* name
* description
* criteria
* createdAt
* updatedAt

### Contact

Suggested fields:

* id
* email
* firstName
* lastName
* status
* attributes required for basic segmentation
* createdAt
* updatedAt

### Email Template Metadata

If required by the architecture:

* id
* templateName
* subject
* SES template name
* description
* createdAt
* updatedAt

Clearly distinguish between:

1. Application metadata stored in DynamoDB.
2. Actual HTML template content stored in Amazon SES.

Do not duplicate data unnecessarily.

---

# 12. API Design

Use AWS AppSync/Amplify for application APIs.

Define the required operations for:

### Campaign

* createCampaign
* getCampaign
* listCampaigns
* updateCampaign
* deleteCampaign
* initiate/send campaign where required

### Segment

* createSegment
* getSegment
* listSegments
* updateSegment
* deleteSegment

### Contact

* createContact
* getContact
* listContacts
* updateContact
* deleteContact

### Email Template

Use Lambda-backed operations where direct Amazon SES API interaction is required:

* create SES template
* update SES template
* delete SES template
* retrieve/list SES templates where required

Do not expose unnecessary AWS service APIs directly to the frontend.

---

# 13. Lambda Functions

Define only the Lambda functions actually required for the basic functionality.

Potential responsibilities include:

* SES template creation
* SES template update
* SES template deletion
* Campaign initiation
* Contact/segment processing
* SQS campaign worker
* SES email sending
* Basic campaign status processing

Do not create Lambda functions unnecessarily if an existing Amplify/AppSync capability can handle the requirement.

Follow a clear naming convention using the project identifier:

**Email Campaign Hub**

Use consistent Lambda naming such as:

```text
email-campaign-hub-<function-purpose>
```

Examples:

```text
email-campaign-hub-create-ses-template
email-campaign-hub-update-ses-template
email-campaign-hub-delete-ses-template
email-campaign-hub-start-campaign
email-campaign-hub-campaign-worker
```

Use appropriate AWS resource tagging, including:

```text
Project = Email Campaign Hub
```

Apply the project tag consistently to supported AWS resources.

---

# 14. Authentication and Authorization

Use Amazon Cognito for authentication.

The initial version can use a single authenticated application user role.

Requirements:

* Authentication required for the application.
* No unauthenticated access to campaign management.
* No API keys for application authentication.
* Protect AppSync operations.
* Apply least-privilege IAM permissions.
* Lambda functions should have only the permissions required for their specific responsibilities.

Do not implement a complex multi-role authorization system in the first version.

---

# 15. SES Requirements

Use Amazon SES for email delivery.

The implementation must support:

* SES email templates
* HTML email content
* Template subject
* Template creation
* Template update
* Template deletion
* Campaign email sending
* SES sending limits
* Basic handling of SES failures

The architecture must be suitable for campaigns containing **10,000+ contacts**.

Do not assume that all 10,000+ emails can be sent simultaneously.

Use SQS + Lambda workers to control and distribute the sending workload.

---

# 16. AWS Cost Requirements

This is very important:

**Do not create unnecessary AWS cost-generating services or infrastructure.**

For the basic version, use only the services required to implement the requirements.

Prefer:

* Amplify
* Cognito
* AppSync
* DynamoDB
* Lambda
* SES
* SQS
* CloudWatch Logs
* S3 only where image storage is actually required

Do not introduce:

* ECS
* EKS
* RDS
* OpenSearch
* ElastiCache
* NAT Gateway
* VPC infrastructure
* Step Functions
* EventBridge
* API Gateway if AppSync already satisfies the requirement
* Other paid infrastructure unless there is a clear requirement

Avoid unnecessary always-running resources.

Use serverless architecture wherever possible.

---

# 17. GitHub and CI/CD

The existing GitHub repository should be used.

Create a deployment strategy using:

```text
GitHub
   ↓
AWS Amplify Hosting
   ↓
Next.js Application
   ↓
Amplify Gen 2 Backend
```

The plan should explain:

* Branch strategy
* Sandbox development
* Environment configuration
* Environment variables
* AWS credentials/permissions
* Build configuration
* Deployment process
* CI/CD workflow
* Safe handling of secrets
* Production deployment considerations

Do not recreate the existing sandbox environment.

---

# 18. Project Structure

Recommend a clean Next.js + Amplify Gen 2 project structure.

Separate:

* UI components
* Campaign components
* Segment components
* Contact components
* Email template components
* Forms
* API/data operations
* Lambda functions
* Shared utilities
* Validation
* Types
* Amplify backend resources

Use reusable components and avoid placing the entire application into large monolithic files.

---

# 19. UI Components Required

Provide a component-level plan for:

### Campaign

* CampaignList
* CampaignForm
* CampaignDetails
* CampaignStatus
* TemplateSelector
* SegmentSelector
* ContactCount
* ScheduleConfiguration
* DeleteConfirmation

### Segment

* SegmentList
* SegmentForm
* SegmentDetails
* SegmentCriteria
* ContactCount
* DeleteConfirmation

### Contacts

* ContactList
* ContactForm
* ContactDetails
* ContactStatus
* DeleteConfirmation
* Pagination/search where appropriate

### Email Templates

* TemplateList
* TemplateForm
* HTMLCodeEditor
* SubjectInput
* TemplatePreview if feasible
* DeleteConfirmation

Use ShadCN/UI components where appropriate.

---

# 20. Validation and Error Handling

The implementation plan must include:

* Form validation
* Email validation
* Required-field validation
* HTML template validation
* Duplicate template handling
* Duplicate campaign handling where applicable
* SES API errors
* SQS failures
* Lambda errors
* DynamoDB errors
* AppSync errors
* Authentication errors
* Loading states
* Empty states
* Success/error notifications

Do not expose sensitive AWS error details to end users.

---

# 21. Scalability Requirements

The application must be designed for at least:

**10,000+ contacts per campaign.**

The plan should explain:

* DynamoDB access patterns
* Pagination
* Segment evaluation
* SQS batching
* Lambda concurrency
* SES sending limits
* Retry strategy
* Duplicate prevention
* Failure handling
* Campaign status tracking

Do not design the frontend to load all 10,000+ contacts simultaneously.

---

# 22. Security Requirements

Follow AWS best practices:

* Cognito authentication
* Least-privilege IAM
* No AWS access keys in frontend code
* No secrets committed to GitHub
* Server-side SES operations
* Server-side SQS operations
* Input validation
* HTML/template validation
* Secure S3 access if S3 is used
* Appropriate CloudWatch logging
* Avoid logging email content or sensitive information unnecessarily

---

# 23. Important Scope Restrictions

The first release should **NOT** include:

* Drag-and-drop email builder
* Advanced email designer
* A/B testing
* Marketing automation
* Customer journeys
* Advanced analytics
* Open/click dashboards
* Complex role management
* Third-party email editor
* CRM integration
* Advanced workflow engine
* Unnecessary AWS infrastructure
* Unnecessary paid AWS services

These can be considered future enhancements.

---

# 24. Required Output From Antigravity

Before making code changes, generate a **complete implementation plan**.

The plan must contain:

1. Current project assessment
2. Existing Amplify sandbox integration approach
3. Overall architecture
4. AWS service architecture
5. Data model
6. AppSync/API design
7. Lambda architecture
8. SQS architecture
9. SES integration
10. SES HTML template workflow
11. Campaign workflow
12. Segment workflow
13. Contact workflow
14. Frontend page structure
15. UI component structure
16. Next.js project structure
17. Authentication architecture
18. IAM requirements
19. DynamoDB access patterns
20. 10,000+ contact campaign processing strategy
21. Error handling
22. Security considerations
23. AWS resource naming conventions
24. AWS tagging strategy
25. GitHub/Amplify CI/CD strategy
26. Environment configuration
27. Development implementation phases
28. Testing strategy
29. Deployment strategy
30. AWS cost-control considerations
31. Future extensibility considerations

---

# 25. Implementation Approach

Divide the implementation into practical phases:

### Phase 1

Existing project assessment and architecture setup.

### Phase 2

Amplify Gen 2 data model and AppSync configuration.

### Phase 3

Cognito authentication.

### Phase 4

Campaign management UI and backend.

### Phase 5

Segment management UI and backend.

### Phase 6

Contact management UI and backend.

### Phase 7

SES HTML template management.

### Phase 8

SQS + Lambda campaign processing.

### Phase 9

SES campaign sending.

### Phase 10

Validation, error handling, security, and scalability testing.

### Phase 11

GitHub + Amplify CI/CD integration.

### Phase 12

Sandbox deployment and end-to-end testing.

---

# Final Instruction

Generate the plan as a **professional production-oriented implementation blueprint** for the **Email Campaign Hub**.

Do not modify the existing Amplify sandbox unnecessarily.

Do not introduce services outside the defined scope unless technically required.

Prioritize:

* Basic functionality
* Clean architecture
* Serverless AWS design
* Low AWS cost
* 10,000+ contact campaign scalability
* Secure SES integration
* SQS-based asynchronous processing
* Maintainable Next.js UI
* Reusable components
* Clear Lambda responsibilities
* Least-privilege IAM
* GitHub-based CI/CD
* Future extensibility

The immediate objective is to build and deploy the **basic working version** of the Email Campaign Hub, not a full Mailchimp replacement.

This version is intentionally scoped so Antigravity should produce a **buildable plan rather than expanding the project into unnecessary marketing/automation features**.
