import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import {
  UPLOAD_SIZE_LIMITS_BYTES,
  UploadType,
} from '@/modules/cloud-storage/cloud-storage.constants';
import { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import { SignedUrlResponseDto } from './dto/signed-url-response.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('v1/uploads')
export class UploadsController {
  constructor(private readonly cloudStorageService: CloudStorageService) {}

  @Post('signed-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a signed upload URL',
    description:
      'Returns a pre-signed PUT URL for uploading a file directly to Cloud Storage. ' +
      'The client must PUT the file to uploadUrl with the matching Content-Type header. ' +
      'Store the returned objectKey in your database to later retrieve a signed download URL.',
  })
  @ApiResponse({ status: 200, type: SignedUrlResponseDto })
  @ApiBadRequestResponse({
    description:
      'Unsupported content type or file size exceeds the limit for the given upload type.',
  })
  @ApiForbiddenResponse({
    description:
      'USER_AVATAR: contextId must match the authenticated user. ' +
      'GROUP_COVER, GROUP_RESOURCE_DOCUMENT, TRIP_RESOURCE: not yet available ' +
      '(membership validation is pending implementation).',
  })
  async generateSignedUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateSignedUrlDto,
  ): Promise<SignedUrlResponseDto> {
    this.authorizeUpload(user, dto.uploadType, dto.contextId);

    if (!this.cloudStorageService.isAllowedContentType(dto.uploadType, dto.contentType)) {
      throw new BadRequestException(
        `Content type "${dto.contentType}" is not allowed for upload type "${dto.uploadType}".`,
      );
    }

    const sizeLimit = UPLOAD_SIZE_LIMITS_BYTES[dto.uploadType];
    if (dto.fileSize > sizeLimit) {
      throw new BadRequestException(
        `File size ${dto.fileSize} bytes exceeds the ${sizeLimit / 1024 / 1024} MB limit for "${dto.uploadType}".`,
      );
    }

    return this.cloudStorageService.generateSignedUploadUrl(
      dto.uploadType,
      dto.contextId,
      dto.contentType,
    );
  }

  private authorizeUpload(
    user: AuthenticatedUser,
    uploadType: UploadType,
    contextId: string,
  ): void {
    switch (uploadType) {
      case UploadType.USER_AVATAR:
        if (contextId !== user.id) {
          throw new ForbiddenException('contextId must match the authenticated user.');
        }
        break;
      case UploadType.GROUP_COVER:
      case UploadType.GROUP_RESOURCE_DOCUMENT:
      case UploadType.TRIP_RESOURCE:
        throw new ForbiddenException(
          `Upload type "${uploadType}" is not available yet. Group and trip membership validation is pending implementation.`,
        );
      default: {
        const _exhaustive: never = uploadType;
        throw new ForbiddenException(`Unknown upload type: ${String(_exhaustive)}`);
      }
    }
  }
}
