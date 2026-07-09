# Inventory: feedback

---

## feedback.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `HttpCode`, `Post` (HTTP method and parameter decorators)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiOperation`, `ApiResponse`, `ApiTags` (OpenAPI documentation decorators)
- `@nestjs/throttler` — `Throttle` (rate-limiting decorator)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user payload)
- `@/modules/feedback/feedback.service` — `FeedbackService` (business logic for creating feedback)
- `@/modules/feedback/dto/create-feedback.dto` — `CreateFeedbackDto` (request body DTO)
- `@/modules/feedback/dto/feedback-response.dto` — `FeedbackResponseDto` (response shape DTO)

### Definitions

- `FeedbackController` (controller) — REST controller at `POST /v1/feedback`; rate-limited to 50 submissions per 24 hours; delegates to `FeedbackService.createFeedback`

### Exports

- `FeedbackController` — named

---

## feedback.module.ts

### Imports

- `@nestjs/common` — `Module` (NestJS module decorator)
- `@/modules/feedback/feedback.controller` — `FeedbackController` (controller to register)
- `@/modules/feedback/feedback.service` — `FeedbackService` (provider to register)

### Definitions

- `FeedbackModule` (module) — NestJS module that registers `FeedbackController` and `FeedbackService`

### Exports

- `FeedbackModule` — named

---

## feedback.service.ts

### Imports

- `@nestjs/common` — `Injectable`, `Logger`, `ServiceUnavailableException` (DI decorator, logger, and HTTP exception)
- `crypto` — `createHash` (used to anonymize user IDs via SHA-256)
- `@/modules/feedback/dto/feedback-response.dto` — `FeedbackResponseDto` (return type for `createFeedback`)

### Definitions

- `GitHubIssueResponse` (interface) — shape of a GitHub REST API issue creation response (`html_url`, `number`, `node_id`)
- `GraphQLResponse<T>` (interface) — generic wrapper for GitHub GraphQL API responses (`data`, `errors`)
- `FeedbackContext` (interface) — optional contextual metadata attached to a feedback submission (`currentPage`, `userAgent`, `viewportSize`, `language`, `theme`)
- `FeedbackService` (service) — creates a GitHub issue from user feedback, anonymizes the submitter via SHA-256, optionally attaches the issue to a GitHub Projects v2 board via GraphQL mutation

### Exports

- `FeedbackContext` — named
- `FeedbackService` — named
