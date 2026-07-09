# Inventory: **tests**

---

## feedback.controller.spec.ts

### Imports

- `@nestjs/common` — `ServiceUnavailableException` for asserting propagated exceptions
- `@nestjs/testing` — `Test`, `TestingModule` for building the NestJS test module
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` used to construct mock auth user
- `@/modules/feedback/feedback.controller` — `FeedbackController` (class under test)
- `@/modules/feedback/feedback.service` — `FeedbackService` (mocked dependency)
- `@/modules/feedback/dto/create-feedback.dto` — `CreateFeedbackDto` type for request payload
- `@/modules/feedback/dto/feedback-response.dto` — `FeedbackResponseDto` type for expected response shape
- `@/types/express` — `AuthenticatedUser` type for the authenticated request user

### Definitions

- `NOW` (const) — fixed Date used to populate timestamps on the mock auth user
- `mockAuthUser` (const) — stub `AuthenticatedUser` with realistic field values for test scenarios
- `mockResponse` (const) — stub `FeedbackResponseDto` containing a fake GitHub issue URL
- `FeedbackController` describe block (function) — test suite covering `POST /`; verifies service delegation, optional context fields, and exception propagation

### Exports

- none

---

## feedback.service.spec.ts

### Imports

- `@nestjs/common` — `ServiceUnavailableException` for asserting thrown exceptions
- `@nestjs/testing` — `Test`, `TestingModule` for building the NestJS test module
- `@/modules/feedback/feedback.service` — `FeedbackService` (class under test)

### Definitions

- `MOCK_ISSUE_URL` (const) — fixed GitHub issue URL used as the expected return value
- `MOCK_ISSUE_NODE_ID` (const) — fixed GitHub issue node ID used in project-linking assertions
- `MOCK_PROJECT_NODE_ID` (const) — fixed GitHub project node ID used in project-linking assertions
- `makeIssueMock` (function) — factory returning a fake `fetch` response for GitHub issue creation
- `makeProjectFetchMock` (function) — factory returning a fake `fetch` response for GraphQL project-ID query
- `makeProjectMutationMock` (function) — factory returning a fake `fetch` response for GraphQL add-item mutation
- `FeedbackService` describe block (function) — test suite with three nested groups: `sanitize` (HTML stripping, whitespace normalization), `createFeedback` (GitHub API call shape, env-var guard, error handling, context embedding, pipe/backtick escaping), and `project linking` (three-call flow, node-ID caching, graceful failure, skip when env var absent)

### Exports

- none
