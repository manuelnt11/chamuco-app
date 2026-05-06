import { ApiProperty } from '@nestjs/swagger';

export class SignedUrlResponseDto {
  @ApiProperty({
    description:
      'Signed URL to use for a direct HTTP PUT upload to Cloud Storage. Expires at expiresAt.',
    example:
      'https://storage.googleapis.com/chamuco-uploads/avatars/user-id/uuid.jpg?X-Goog-Signature=...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'GCS object key. Store this in your database to reference the file.',
    example: 'avatars/01933b1a-7b4c-7000/550e8400-e29b-41d4-a716.jpg',
  })
  objectKey!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the uploadUrl expires (15 minutes from issuance).',
    example: '2026-05-05T14:00:00.000Z',
  })
  expiresAt!: string;
}
