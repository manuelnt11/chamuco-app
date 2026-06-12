import type { UploadType } from '@chamuco/shared-types';

export interface GetSignedUrlPayload {
  uploadType: UploadType;
  contextId: string;
  contentType: string;
  fileSize: number;
}
