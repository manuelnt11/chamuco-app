'use client';

import { useState } from 'react';
import { ChatCircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';

export function FeedbackButton() {
  const { t } = useTranslation('feedback');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label={t('button.label')}
      >
        <ChatCircleIcon className="size-5" aria-hidden="true" />
      </Button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
