import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { UPLOAD_SIZE_LIMITS_BYTES } from '@/modules/cloud-storage/cloud-storage.constants';
import { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import { SignedUrlResponseDto } from './dto/signed-url-response.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { BadRequestException } from '@nestjs/common';

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
  async generateSignedUrl(
    @CurrentUser() _user: AuthenticatedUser,
    @Body() dto: GenerateSignedUrlDto,
  ): Promise<SignedUrlResponseDto> {
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
}
