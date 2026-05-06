import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import {
  ALLOWED_CONTENT_TYPES,
  DOWNLOAD_TTL_SECONDS,
  OBJECT_KEY_PREFIXES,
  UPLOAD_URL_TTL_SECONDS,
  UploadType,
} from './cloud-storage.constants';

export interface SignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

@Injectable()
export class CloudStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage();
    this.bucketName = this.configService.getOrThrow<string>('GOOGLE_CLOUD_STORAGE_BUCKET');
  }

  async generateSignedUploadUrl(
    uploadType: UploadType,
    contextId: string,
    contentType: string,
  ): Promise<SignedUploadUrlResult> {
    const extension = this.extensionFromContentType(contentType);
    const objectKey = `${OBJECT_KEY_PREFIXES[uploadType]}/${contextId}/${randomUUID()}${extension}`;
    const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000);

    const [uploadUrl] = await this.storage
      .bucket(this.bucketName)
      .file(objectKey)
      .getSignedUrl({ action: 'write', contentType, expires: expiresAt });

    return { uploadUrl, objectKey, expiresAt: expiresAt.toISOString() };
  }

  async generateSignedDownloadUrl(objectKey: string, uploadType: UploadType): Promise<string> {
    const ttl = DOWNLOAD_TTL_SECONDS[uploadType];
    const expires = new Date(Date.now() + ttl * 1000);

    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectKey)
      .getSignedUrl({ action: 'read', expires });

    return url;
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(objectKey).delete({ ignoreNotFound: true });
  }

  isAllowedContentType(uploadType: UploadType, contentType: string): boolean {
    return ALLOWED_CONTENT_TYPES[uploadType].includes(contentType);
  }

  private extensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    return map[contentType] ?? '';
  }
}
