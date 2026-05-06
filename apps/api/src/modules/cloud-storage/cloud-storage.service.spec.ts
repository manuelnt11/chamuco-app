import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudStorageService } from './cloud-storage.service';
import {
  ALLOWED_CONTENT_TYPES,
  DOWNLOAD_TTL_SECONDS,
  OBJECT_KEY_PREFIXES,
  UPLOAD_URL_TTL_SECONDS,
  UploadType,
} from './cloud-storage.constants';

const mockGetSignedUrl = jest.fn();
const mockDelete = jest.fn();
const mockFile = jest.fn(() => ({
  getSignedUrl: mockGetSignedUrl,
  delete: mockDelete,
}));
const mockBucket = jest.fn(() => ({ file: mockFile }));

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: mockBucket })),
}));

describe('CloudStorageService', () => {
  let service: CloudStorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudStorageService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('chamuco-uploads') },
        },
      ],
    }).compile();

    service = module.get<CloudStorageService>(CloudStorageService);
  });

  describe('generateSignedUploadUrl', () => {
    it('returns uploadUrl, objectKey, and expiresAt', async () => {
      const signedUrl = 'https://storage.googleapis.com/signed-put-url';
      mockGetSignedUrl.mockResolvedValueOnce([signedUrl]);

      const result = await service.generateSignedUploadUrl(
        UploadType.USER_AVATAR,
        'user-123',
        'image/jpeg',
      );

      expect(result.uploadUrl).toBe(signedUrl);
      expect(result.objectKey).toMatch(/^avatars\/user-123\/.+\.jpg$/);
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('uses the correct prefix per upload type', async () => {
      mockGetSignedUrl.mockResolvedValue(['https://url']);

      for (const [type, prefix] of Object.entries(OBJECT_KEY_PREFIXES)) {
        const result = await service.generateSignedUploadUrl(
          type as UploadType,
          'ctx-id',
          'image/jpeg',
        );
        expect(result.objectKey).toMatch(new RegExp(`^${prefix}/`));
      }
    });

    it('sets expiry ~15 minutes in the future', async () => {
      mockGetSignedUrl.mockResolvedValueOnce(['https://url']);

      const before = Date.now();
      const result = await service.generateSignedUploadUrl(
        UploadType.GROUP_COVER,
        'group-1',
        'image/png',
      );
      const after = Date.now();

      const expiresMs = new Date(result.expiresAt).getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(before + UPLOAD_URL_TTL_SECONDS * 1000 - 100);
      expect(expiresMs).toBeLessThanOrEqual(after + UPLOAD_URL_TTL_SECONDS * 1000 + 100);
    });

    it('calls getSignedUrl with action write and correct contentType', async () => {
      mockGetSignedUrl.mockResolvedValueOnce(['https://url']);

      await service.generateSignedUploadUrl(UploadType.USER_AVATAR, 'u1', 'image/webp');

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'write', contentType: 'image/webp' }),
      );
    });

    it.each([
      ['image/jpeg', '.jpg'],
      ['image/png', '.png'],
      ['image/webp', '.webp'],
      ['application/pdf', '.pdf'],
      ['application/msword', '.doc'],
      ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
      ['application/octet-stream', ''],
    ])('maps content type %s to extension %s', async (contentType, extension) => {
      mockGetSignedUrl.mockResolvedValueOnce(['https://url']);

      const result = await service.generateSignedUploadUrl(
        UploadType.TRIP_RESOURCE,
        'trip-1',
        contentType,
      );

      if (extension) {
        expect(result.objectKey).toMatch(new RegExp(`\\${extension}$`));
      } else {
        expect(result.objectKey).not.toMatch(/\.\w+$/);
      }
    });
  });

  describe('generateSignedDownloadUrl', () => {
    it('returns a signed read URL', async () => {
      const signedUrl = 'https://storage.googleapis.com/signed-read-url';
      mockGetSignedUrl.mockResolvedValueOnce([signedUrl]);

      const url = await service.generateSignedDownloadUrl(
        'avatars/user-1/file.jpg',
        UploadType.USER_AVATAR,
      );

      expect(url).toBe(signedUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.objectContaining({ action: 'read' }));
    });

    it.each([
      [UploadType.USER_AVATAR, DOWNLOAD_TTL_SECONDS[UploadType.USER_AVATAR]],
      [UploadType.GROUP_COVER, DOWNLOAD_TTL_SECONDS[UploadType.GROUP_COVER]],
      [
        UploadType.GROUP_RESOURCE_DOCUMENT,
        DOWNLOAD_TTL_SECONDS[UploadType.GROUP_RESOURCE_DOCUMENT],
      ],
      [UploadType.TRIP_RESOURCE, DOWNLOAD_TTL_SECONDS[UploadType.TRIP_RESOURCE]],
    ])('uses correct TTL for %s', async (uploadType, ttlSeconds) => {
      mockGetSignedUrl.mockResolvedValueOnce(['https://url']);

      const before = Date.now();
      await service.generateSignedDownloadUrl('some/key', uploadType);
      const after = Date.now();

      const { expires } = mockGetSignedUrl.mock.calls[0][0] as { expires: Date };
      const expiresMs = expires.getTime();

      expect(expiresMs).toBeGreaterThanOrEqual(before + ttlSeconds * 1000 - 100);
      expect(expiresMs).toBeLessThanOrEqual(after + ttlSeconds * 1000 + 100);
    });
  });

  describe('deleteObject', () => {
    it('calls delete on the correct file', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await service.deleteObject('avatars/user-1/file.jpg');

      expect(mockFile).toHaveBeenCalledWith('avatars/user-1/file.jpg');
      expect(mockDelete).toHaveBeenCalledWith({ ignoreNotFound: true });
    });

    it('passes ignoreNotFound to tolerate already-deleted files', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await service.deleteObject('nonexistent/file.jpg');

      expect(mockDelete).toHaveBeenCalledWith({ ignoreNotFound: true });
    });
  });

  describe('isAllowedContentType', () => {
    it.each(
      Object.entries(ALLOWED_CONTENT_TYPES).flatMap(([type, mimes]) =>
        mimes.map((mime) => [type, mime, true]),
      ),
    )('%s allows %s', (uploadType, contentType, expected) => {
      expect(service.isAllowedContentType(uploadType as UploadType, contentType as string)).toBe(
        expected,
      );
    });

    it('rejects an unsupported MIME for USER_AVATAR', () => {
      expect(service.isAllowedContentType(UploadType.USER_AVATAR, 'application/pdf')).toBe(false);
    });

    it('rejects an unsupported MIME for GROUP_RESOURCE_DOCUMENT', () => {
      expect(service.isAllowedContentType(UploadType.GROUP_RESOURCE_DOCUMENT, 'image/gif')).toBe(
        false,
      );
    });

    it('rejects an unknown MIME type', () => {
      expect(service.isAllowedContentType(UploadType.USER_AVATAR, 'application/x-unknown')).toBe(
        false,
      );
    });
  });
});
