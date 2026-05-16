'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

interface DeleteConfirmButtonProps {
  onDelete: () => void | Promise<void>;
  disabled?: boolean;
  size?: ButtonSize;
}

export function DeleteConfirmButton({ onDelete, disabled, size = 'sm' }: DeleteConfirmButtonProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!confirming) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (confirmBtnRef.current?.contains(e.target as Node)) return;
      setConfirming(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [confirming]);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    void onDelete();
  }

  return (
    <Button
      ref={confirming ? confirmBtnRef : undefined}
      type="button"
      size={size}
      variant={confirming ? 'destructive' : 'outline'}
      onClick={handleClick}
      disabled={disabled}
    >
      {confirming ? t('actions.deleteConfirm') : t('actions.delete')}
    </Button>
  );
}
