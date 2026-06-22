'use client';

import { type SubmitEvent } from 'react';

import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface AnnouncementFormProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitLabel: string;
  placeholder: string;
  errorMessage?: string;
}

export function AnnouncementForm({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  submitLabel,
  placeholder,
  errorMessage,
}: AnnouncementFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={2000}
        disabled={isSubmitting}
      />
      {errorMessage && <p className="mt-1 text-sm text-destructive">{errorMessage}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !value.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
