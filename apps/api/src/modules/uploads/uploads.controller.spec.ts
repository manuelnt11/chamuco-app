jest.mock('@google-cloud/storage', () => ({ Storage: jest.fn() }));

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { UploadsController } from './uploads.controller';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { UploadType } from '@/modules/cloud-storage/cloud-storage.constants';
import type { GenerateSignedUrlDto } from './dto/generate-signed-url.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockSignedUrlResult = {
  uploadUrl: 'https://storage.googleapis.com/signed-url',
  objectKey: 'avatars/user-uuid/uuid.jpg',
  expiresAt: '2026-05-05T14:00:00.000Z',
};

let mockIsAllowedContentType: jest.Mock;
let mockGenerateSignedUploadUrl: jest.Mock;

describe('UploadsController', () => {
  let controller: UploadsController;

  beforeEach(async () => {
    mockIsAllowedContentType = jest.fn().mockReturnValue(true);
    mockGenerateSignedUploadUrl = jest.fn().mockResolvedValue(mockSignedUrlResult);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: CloudStorageService,
          useValue: {
            isAllowedContentType: mockIsAllowedContentType,
            generateSignedUploadUrl: mockGenerateSignedUploadUrl,
          },
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  describe('POST /v1/uploads/signed-url', () => {
    const validDto: GenerateSignedUrlDto = {
      uploadType: UploadType.USER_AVATAR,
      contextId: 'user-uuid',
      contentType: 'image/jpeg',
      fileSize: 500 * 1024,
    };

    it('returns a signed URL result for a valid request', async () => {
      const result = await controller.generateSignedUrl(mockAuthUser, validDto);

      expect(result).toEqual(mockSignedUrlResult);
      expect(mockGenerateSignedUploadUrl).toHaveBeenCalledWith(
        UploadType.USER_AVATAR,
        'user-uuid',
        'image/jpeg',
      );
    });

    it('throws BadRequestException for an unsupported content type', async () => {
      mockIsAllowedContentType.mockReturnValue(false);

      await expect(controller.generateSignedUrl(mockAuthUser, validDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGenerateSignedUploadUrl).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when file size exceeds the limit for USER_AVATAR (2MB)', async () => {
      const dto: GenerateSignedUrlDto = {
        ...validDto,
        fileSize: 3 * 1024 * 1024,
      };

      await expect(controller.generateSignedUrl(mockAuthUser, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGenerateSignedUploadUrl).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when file size exceeds the limit for GROUP_COVER (5MB)', async () => {
      const dto: GenerateSignedUrlDto = {
        uploadType: UploadType.GROUP_COVER,
        contextId: 'group-uuid',
        contentType: 'image/png',
        fileSize: 6 * 1024 * 1024,
      };

      await expect(controller.generateSignedUrl(mockAuthUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when file size exceeds the limit for GROUP_RESOURCE_DOCUMENT (20MB)', async () => {
      const dto: GenerateSignedUrlDto = {
        uploadType: UploadType.GROUP_RESOURCE_DOCUMENT,
        contextId: 'group-uuid',
        contentType: 'application/pdf',
        fileSize: 21 * 1024 * 1024,
      };

      await expect(controller.generateSignedUrl(mockAuthUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('accepts a file exactly at the size limit', async () => {
      const dto: GenerateSignedUrlDto = {
        ...validDto,
        fileSize: 2 * 1024 * 1024,
      };

      await expect(controller.generateSignedUrl(mockAuthUser, dto)).resolves.toEqual(
        mockSignedUrlResult,
      );
    });

    it('delegates content type validation to CloudStorageService', async () => {
      await controller.generateSignedUrl(mockAuthUser, validDto);

      expect(mockIsAllowedContentType).toHaveBeenCalledWith(UploadType.USER_AVATAR, 'image/jpeg');
    });
  });
});
