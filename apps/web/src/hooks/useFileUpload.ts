'use client';

import { useState, useCallback } from 'react';
import { UploadType } from '@chamuco/shared-types';
import { apiClient } from '@/services/api-client';
import { uploadToGcs } from '@/services/gcs-upload';

export { UploadType } from '@chamuco/shared-types';

export interface UseFileUploadOptions {
  uploadType: UploadType;
  contextId: string;
}

export interface UseFileUploadReturn {
  upload: (file: File) => Promise<string>;
  progress: number;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

interface SignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

export function useFileUpload({
  uploadType,
  contextId,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const { data } = await apiClient.post<SignedUrlResponse>('/v1/uploads/signed-url', {
          uploadType,
          contextId,
          contentType: file.type,
          fileSize: file.size,
        });

        await uploadToGcs(data.uploadUrl, file, setProgress);
        setProgress(100);
        return data.objectKey;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        console.error('[useFileUpload]', message);
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadType, contextId],
  );

  return { upload, progress, isUploading, error, reset };
}
