import type { UploadType } from '@chamuco/shared-types';

export interface SignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

export interface GetSignedUrlPayload {
  uploadType: UploadType;
  contextId: string;
  contentType: string;
  fileSize: number;
}
