'use client';

import { useRef, type ReactNode, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { UploadType } from '@/hooks/useFileUpload';

const ACCEPTED_TYPES: Record<UploadType, string> = {
  USER_AVATAR: 'image/jpeg,image/png,image/webp',
  GROUP_COVER: 'image/jpeg,image/png,image/webp',
  GROUP_RESOURCE_DOCUMENT: 'application/pdf,image/jpeg,image/png,.doc,.docx',
  TRIP_RESOURCE: 'application/pdf,image/jpeg,image/png,.doc,.docx',
};

export interface FileUploadButtonProps {
  uploadType: UploadType;
  contextId: string;
  onSuccess: (objectKey: string) => void;
  onError?: (error: Error) => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FileUploadButton({
  uploadType,
  contextId,
  onSuccess,
  onError,
  children,
  className,
  disabled = false,
}: FileUploadButtonProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, progress, isUploading, error, reset } = useFileUpload({ uploadType, contextId });

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same file can be re-selected after an error
    if (inputRef.current) inputRef.current.value = '';

    try {
      const objectKey = await upload(file);
      onSuccess(objectKey);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  function handleClick() {
    reset();
    inputRef.current?.click();
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES[uploadType]}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        aria-label={isUploading ? t('upload.uploading') : undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        {isUploading ? t('upload.uploading') : (children ?? t('upload.chooseFile'))}
      </button>

      {isUploading && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('upload.progressLabel', { progress })}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && !isUploading && (
        <p className="text-xs text-destructive">
          {error}{' '}
          <button
            type="button"
            onClick={handleClick}
            className="underline underline-offset-2 hover:no-underline"
          >
            {t('upload.retry')}
          </button>
        </p>
      )}
    </div>
  );
}
