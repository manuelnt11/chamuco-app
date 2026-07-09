# Inventory: dto

---

## generate-signed-url.dto.ts

### Imports

- `class-validator` — `IsEnum`, `IsInt`, `IsNotEmpty`, `IsString`, `Max`, `Min` for request field validation decorators
- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation on each field
- `@/modules/cloud-storage/cloud-storage.constants` — `UploadType` enum and `UPLOAD_SIZE_LIMITS_BYTES` map for enum validation and dynamic description generation

### Definitions

- `GenerateSignedUrlDto` (class) — Request body DTO for `POST /v1/uploads/signed-url`; validates upload category, owning entity ID, MIME type, and file size before a signed URL is generated

### Exports

- `GenerateSignedUrlDto` — named

---

## signed-url-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation on each field
- `@chamuco/shared-types` — `SignedUrlResponse` interface that this DTO implements for compile-time structural compatibility

### Definitions

- `SignedUrlResponseDto` (class) — Response DTO for the signed URL endpoint; exposes `uploadUrl` (GCS signed PUT URL), `objectKey` (GCS path to store in DB), and `expiresAt` (ISO 8601 expiry timestamp)

### Exports

- `SignedUrlResponseDto` — named
