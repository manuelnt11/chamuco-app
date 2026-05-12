import { Injectable } from '@nestjs/common';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import type { Asset, ResolvedAsset } from '@chamuco/shared-types';
import {
  DOWNLOAD_TTL_SECONDS,
  OBJECT_KEY_TO_UPLOAD_TYPE,
} from '@/modules/cloud-storage/cloud-storage.constants';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';

@Injectable()
export class AssetResolverService {
  constructor(private readonly cloudStorage: CloudStorageService) {}

  // TODO: add fallback so resolve() never returns null for a non-null asset —
  // GCS signed-URL failures should surface a placeholder URL rather than
  // propagating null to callers, which currently forces them to throw or guard.
  async resolve(asset: Asset | null): Promise<ResolvedAsset | null> {
    if (!asset) return null;
    return this.resolveOne(asset);
  }

  async resolveMany(assets: Asset[]): Promise<ResolvedAsset[]> {
    return Promise.all(assets.map((a) => this.resolveOne(a)));
  }

  private async resolveOne(asset: Asset): Promise<ResolvedAsset> {
    switch (asset.source) {
      case 'url':
        return { ...asset, url: asset.target };
      case 'emoji':
        return { ...asset, url: getTwemojiUrl(asset.target) };
      case 'text':
        return { ...asset, url: asset.target };
      case 'gcs': {
        if (asset.isPublic) {
          return { ...asset, url: this.cloudStorage.getPublicUrl(asset.target) };
        }
        const prefix = asset.target.split('/')[0];
        const uploadType = prefix ? OBJECT_KEY_TO_UPLOAD_TYPE[prefix] : undefined;
        const ttl = uploadType ? DOWNLOAD_TTL_SECONDS[uploadType] : 3600;
        const expiresAt = new Date(Date.now() + ttl * 1000);
        const signedUrl = uploadType
          ? await this.cloudStorage.generateSignedDownloadUrl(asset.target, uploadType)
          : this.cloudStorage.getPublicUrl(asset.target);
        return { ...asset, url: signedUrl, expiresAt: expiresAt.toISOString() };
      }
    }
  }
}
