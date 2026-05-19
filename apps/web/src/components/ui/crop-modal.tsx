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
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isPending, setIsPending] = useState(false);

  // Stable refs so the touch handler closure never goes stale
  const latestCropRef = useRef<Crop | undefined>(undefined);
  const pinchRef = useRef<{ startDist: number; startCrop: Crop } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function pinchDist(touches: TouchList) {
      return Math.hypot(
        touches[1]!.clientX - touches[0]!.clientX,
        touches[1]!.clientY - touches[0]!.clientY,
      );
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2 && latestCropRef.current) {
        pinchRef.current = { startDist: pinchDist(e.touches), startCrop: latestCropRef.current };
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();

      const scale = pinchDist(e.touches) / pinchRef.current.startDist;
      const base = pinchRef.current.startCrop;

      let bx: number, by: number, bw: number, bh: number;
      if (base.unit === '%') {
        bx = base.x;
        by = base.y;
        bw = base.width;
        bh = base.height;
      } else {
        const imgW = imgRef.current?.clientWidth ?? 0;
        const imgH = imgRef.current?.clientHeight ?? 0;
        if (!imgW || !imgH) return;
        bx = (base.x / imgW) * 100;
        by = (base.y / imgH) * 100;
        bw = (base.width / imgW) * 100;
        bh = (base.height / imgH) * 100;
      }

      // Scale both dimensions uniformly — bh already encodes the visual aspect ratio
      const minScale = Math.max(10 / bw, 10 / bh);
      const maxScale = Math.min(100 / bw, 100 / bh);
      const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
      const newWidth = bw * clampedScale;
      const newHeight = bh * clampedScale;
      const cx = bx + bw / 2;
      const cy = by + bh / 2;

      const newCrop: Crop = {
        unit: '%',
        width: newWidth,
        height: newHeight,
        x: Math.max(0, Math.min(100 - newWidth, cx - newWidth / 2)),
        y: Math.max(0, Math.min(100 - newHeight, cy - newHeight / 2)),
      };

      latestCropRef.current = newCrop;
      setCrop(newCrop);
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchRef.current = null;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []); // stable: all mutable state accessed via refs

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, naturalWidth, naturalHeight),
      naturalWidth,
      naturalHeight,
    );
    latestCropRef.current = initial;
    setCrop(initial);
  }

  function handleConfirm() {
    const img = imgRef.current;
    const activeCrop = completedCrop ?? crop;
    if (!img || !activeCrop || isPending) return;
    setIsPending(true);

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = resolvedOutputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsPending(false);
      return;
    }

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
        setIsPending(false);
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.9,
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-lg font-semibold leading-none tracking-tight">{title}</p>

      <div
        ref={containerRef}
        data-testid="crop-container"
        className="overflow-hidden rounded-lg bg-muted"
      >
        {imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(c) => {
              latestCropRef.current = c;
              setCrop(c);
            }}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={circular}
            keepSelection
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              data-testid="crop-image"
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
          disabled={isConfirming || isPending || !crop}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
