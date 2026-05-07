export type AssetType = 'image' | 'video' | 'file' | 'link' | 'text';
export type AssetSource = 'gcs' | 'url' | 'emoji' | 'text';

export interface Asset {
  id: string;
  type: AssetType;
  source: AssetSource;
  target: string;
  fileSize?: number;
  isPublic: boolean;
  createdAt: string;
}

export interface ResolvedAsset extends Asset {
  url: string;
  expiresAt?: string;
}
