import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  UploadType,
  UPLOAD_SIZE_LIMITS_BYTES,
} from '@/modules/cloud-storage/cloud-storage.constants';

export class GenerateSignedUrlDto {
  @ApiProperty({
    enum: UploadType,
    description:
      'Category of file being uploaded. Determines allowed MIME types, max size, and storage path.',
    example: UploadType.USER_AVATAR,
  })
  @IsEnum(UploadType)
  uploadType!: UploadType;

  @ApiProperty({
    description: 'ID of the entity that owns this file (user ID, group ID, or trip ID).',
    example: '01933b1a-7b4c-7000-0000-000000000001',
  })
  @IsString()
  @IsNotEmpty()
  contextId!: string;

  @ApiProperty({
    description: 'MIME type of the file. Must be an allowed type for the given uploadType.',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({
    description:
      `File size in bytes. Must not exceed the limit for the given uploadType:\n` +
      Object.entries(UPLOAD_SIZE_LIMITS_BYTES)
        .map(([type, bytes]) => `- ${type}: ${bytes / 1024 / 1024} MB`)
        .join('\n'),
    example: 204800,
  })
  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  fileSize!: number;
}
