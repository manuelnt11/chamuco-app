'use client';

import { useEffect, useState } from 'react';
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
const SUCCESS_CLOSE_DELAY_MS = 5000;

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
  const [submitted, setSubmitted] = useState(false);

  const trimmed = comment.trim();
  const isTooShort = trimmed.length > 0 && trimmed.length < MIN_CHARS;
  const isValid = trimmed.length >= MIN_CHARS;

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, SUCCESS_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [submitted, onClose]);

  function handleClose() {
    if (loading) return;
    setComment('');
    setSubmitted(false);
    onClose();
  }

  function handleOpenChange(next: boolean) {
    if (!next) handleClose();
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    try {
      await apiClient.post<FeedbackResponseDto>('/v1/feedback', {
        comment: trimmed,
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      });
      setComment('');
      setSubmitted(true);
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
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('modal.successTitle')}</DialogTitle>
              <DialogDescription>{t('modal.successDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose}>{t('modal.close')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
              <Button variant="ghost" disabled={loading} onClick={handleClose}>
                {t('modal.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={!isValid || loading}>
                {loading ? t('modal.submitting') : t('modal.submit')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}
