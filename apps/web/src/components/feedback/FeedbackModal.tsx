'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';

const MAX_CHARS = 2000;
const MIN_CHARS = 10;

interface FeedbackResponseDto {
  issueUrl: string;
}

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { t } = useTranslation('feedback');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmed = comment.trim();
  const isTooShort = trimmed.length > 0 && trimmed.length < MIN_CHARS;
  const isValid = trimmed.length >= MIN_CHARS;

  function handleOpenChange(next: boolean) {
    if (!next && !loading) {
      setComment('');
      onClose();
    }
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    try {
      await apiClient.post<FeedbackResponseDto>('/v1/feedback', {
        comment: trimmed,
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
        viewportSize: `${window.innerWidth.toString()}x${window.innerHeight.toString()}`,
        language: navigator.language,
      });
      toast.success(t('success'));
      setComment('');
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        toast.error(t('errors.rateLimitExceeded'));
      } else {
        toast.error(t('errors.submitFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{t('modal.title')}</DialogTitle>
          <DialogDescription>{t('modal.description')}</DialogDescription>
        </DialogHeader>

        <div className="my-4 flex flex-col gap-1.5">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('modal.placeholder')}
            maxLength={MAX_CHARS}
            rows={5}
            aria-invalid={isTooShort || undefined}
            disabled={loading}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {isTooShort ? (
              <span className="text-destructive">{t('errors.tooShort')}</span>
            ) : (
              <span />
            )}
            <span>{t('modal.charCount', { count: comment.length })}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={loading} onClick={() => handleOpenChange(false)}>
            {t('modal.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? t('modal.submitting') : t('modal.submit')}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
