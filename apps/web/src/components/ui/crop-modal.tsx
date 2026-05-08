'use client';

import { useState, useRef, useEffect, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CropModalProps {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  isConfirming: boolean;
  uploadProgress: number;
  isUploading: boolean;
  title: string;
  confirmLabel: string;
  circular?: boolean;
  aspect?: number;
  outputWidth?: number;
  outputHeight?: number;
}

export function CropModal({
  file,
  onConfirm,
  onCancel,
  isConfirming,
  uploadProgress,
  isUploading,
  title,
  confirmLabel,
  circular = false,
  aspect = 1,
  outputWidth = 512,
  outputHeight,
}: CropModalProps) {
  const { t } = useTranslation('common');
  const resolvedOutputHeight = outputHeight ?? outputWidth;
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, naturalWidth, naturalHeight),
      naturalWidth,
      naturalHeight,
    );
    setCrop(initial);
  }

  function handleConfirm() {
    const img = imgRef.current;
    const activeCrop = completedCrop ?? crop;
    if (!img || !activeCrop) return;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = resolvedOutputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sx: number, sy: number, sw: number, sh: number;

    if (activeCrop.unit === '%') {
      sx = (activeCrop.x / 100) * img.naturalWidth;
      sy = (activeCrop.y / 100) * img.naturalHeight;
      sw = (activeCrop.width / 100) * img.naturalWidth;
      sh = (activeCrop.height / 100) * img.naturalHeight;
    } else {
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;
      sx = activeCrop.x * scaleX;
      sy = activeCrop.y * scaleY;
      sw = activeCrop.width * scaleX;
      sh = activeCrop.height * scaleY;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, resolvedOutputHeight);

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.9,
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-lg font-semibold leading-none tracking-tight">{title}</p>

      <div className="overflow-hidden rounded-lg bg-muted">
        {imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={circular}
            keepSelection
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              onLoad={onImageLoad}
              className="block w-full max-h-72 object-contain"
            />
          </ReactCrop>
        )}
      </div>

      {isUploading && (
        <div
          role="progressbar"
          aria-valuenow={uploadProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('upload.progressLabel', { progress: uploadProgress })}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming || !crop}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
