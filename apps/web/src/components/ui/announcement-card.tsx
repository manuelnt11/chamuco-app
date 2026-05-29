'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MarkdownContent } from '@/components/ui/markdown-content';

const LINE_CLAMP: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

interface AnnouncementCardProps {
  content: string;
  postedByLabel: string; // pre-formatted by caller (namespace-agnostic)
  createdAt: string;
  collapsedLines?: number; // default 3
  noCollapse?: boolean; // disable truncation entirely (for full-list views)
}

export function AnnouncementCard({
  content,
  postedByLabel,
  createdAt,
  collapsedLines = 3,
  noCollapse = false,
}: AnnouncementCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (noCollapse) return;
    const el = contentRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [content, noCollapse]);

  const clampClass =
    noCollapse || expanded ? undefined : (LINE_CLAMP[collapsedLines] ?? 'line-clamp-3');

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div ref={contentRef} className={clampClass}>
        <MarkdownContent content={content} />
      </div>
      {!noCollapse && isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs text-primary hover:underline"
        >
          {expanded ? t('actions.viewLess') : t('actions.viewMore')}
        </button>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {postedByLabel} &middot;{' '}
        {new Date(createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </li>
  );
}
