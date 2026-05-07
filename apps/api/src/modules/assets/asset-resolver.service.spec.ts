import { Test, TestingModule } from '@nestjs/testing';
import { AssetResolverService } from './asset-resolver.service';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import type { Asset } from '@chamuco/shared-types';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const BUCKET = 'chamuco-uploads';

const mockCloudStorage = {
  getPublicUrl: jest.fn((key: string) => `https://storage.googleapis.com/${BUCKET}/${key}`),
  generateSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed.example.com/url'),
};

describe('AssetResolverService', () => {
  let service: AssetResolverService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetResolverService,
        { provide: CloudStorageService, useValue: mockCloudStorage },
      ],
    }).compile();

    service = module.get<AssetResolverService>(AssetResolverService);
  });

  describe('resolve', () => {
    it('returns null when asset is null', async () => {
      expect(await service.resolve(null)).toBeNull();
    });

    it('resolves url source: url = target', async () => {
      const asset: Asset = {
        id: 'a1',
        type: 'image',
        source: 'url',
        target: 'https://lh3.googleusercontent.com/photo.jpg',
        isPublic: true,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toBe(asset.target);
      expect(result?.expiresAt).toBeUndefined();
    });

    it('resolves emoji source: url = twemoji CDN', async () => {
      const asset: Asset = {
        id: 'a2',
        type: 'image',
        source: 'emoji',
        target: '😀',
        isPublic: true,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toContain('cdn.jsdelivr.net/gh/realityripple/emoji');
      expect(result?.url).toContain('1f600');
    });

    it('resolves text source: url = target', async () => {
      const asset: Asset = {
        id: 'a3',
        type: 'text',
        source: 'text',
        target: 'Hello world',
        isPublic: false,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toBe('Hello world');
    });

    it('resolves gcs public: returns public URL, no expiresAt', async () => {
      const asset: Asset = {
        id: 'a4',
        type: 'image',
        source: 'gcs',
        target: 'avatars/user-uuid/photo.jpg',
        isPublic: true,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toBe(
        `https://storage.googleapis.com/${BUCKET}/avatars/user-uuid/photo.jpg`,
      );
      expect(result?.expiresAt).toBeUndefined();
      expect(mockCloudStorage.generateSignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('resolves gcs private: returns signed URL + expiresAt', async () => {
      const asset: Asset = {
        id: 'a5',
        type: 'file',
        source: 'gcs',
        target: 'group-resources/g-uuid/document.pdf',
        isPublic: false,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toBe('https://signed.example.com/url');
      expect(result?.expiresAt).toBeDefined();
    });

    it('resolves gcs private with unknown prefix: falls back to public URL + expiresAt', async () => {
      const asset: Asset = {
        id: 'a6',
        type: 'file',
        source: 'gcs',
        target: 'unknown-bucket/file.pdf',
        isPublic: false,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toContain('unknown-bucket/file.pdf');
      expect(result?.expiresAt).toBeDefined();
      expect(mockCloudStorage.generateSignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('resolves gcs private with no-slash target: falls back to public URL + expiresAt', async () => {
      const asset: Asset = {
        id: 'a7',
        type: 'file',
        source: 'gcs',
        target: '/file.pdf',
        isPublic: false,
        createdAt: new Date().toISOString(),
      };
      const result = await service.resolve(asset);
      expect(result?.url).toBeDefined();
      expect(result?.expiresAt).toBeDefined();
      expect(mockCloudStorage.generateSignedDownloadUrl).not.toHaveBeenCalled();
    });
  });

  describe('resolveMany', () => {
    it('resolves all assets in parallel', async () => {
      const assetA: Asset = {
        id: 'a1',
        type: 'image',
        source: 'url',
        target: 'https://example.com/a.jpg',
        isPublic: true,
        createdAt: new Date().toISOString(),
      };
      const assetB: Asset = {
        id: 'a2',
        type: 'image',
        source: 'emoji',
        target: '🏖️',
        isPublic: true,
        createdAt: new Date().toISOString(),
      };
      const results = await service.resolveMany([assetA, assetB]);
      expect(results).toHaveLength(2);
      expect(results[0]?.url).toBe('https://example.com/a.jpg');
      expect(results[1]?.url).toContain('cdn.jsdelivr.net');
    });
  });
});
