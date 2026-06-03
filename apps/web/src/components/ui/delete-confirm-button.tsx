'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

interface DeleteConfirmButtonProps {
  onDelete: () => void | Promise<void>;
  disabled?: boolean;
}

export function DeleteConfirmButton({ onDelete, disabled }: DeleteConfirmButtonProps) {
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
      size="icon"
      variant={confirming ? 'destructive' : 'outline'}
      onClick={handleClick}
      disabled={disabled}
      className={confirming ? 'w-auto px-2.5' : undefined}
      {...(!confirming && {
        title: t('actions.delete'),
        'aria-label': t('actions.delete'),
      })}
    >
      {confirming ? t('actions.deleteConfirm') : <TrashIcon aria-hidden="true" />}
    </Button>
  );
}
