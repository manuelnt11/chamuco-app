'use client';

import Link from 'next/link';
import { XIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

interface PendingJoinRequestsSectionProps<T> {
  headingId: string;
  titleText: string;
  items: T[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  getCoverUrl: (item: T) => string | null;
  getInitiatedAt: (item: T) => string;
  getHref: (item: T) => string;
  cancelLabel: string;
  cancelErrorLabel: string;
  cancellingIds: Set<string>;
  errorIds: Set<string>;
  onCancel: (item: T) => void;
  locale: string;
}

export function PendingJoinRequestsSection<T>({
  headingId,
  titleText,
  items,
  getId,
  getName,
  getCoverUrl,
  getInitiatedAt,
  getHref,
  cancelLabel,
  cancelErrorLabel,
  cancellingIds,
  errorIds,
  onCancel,
  locale,
}: PendingJoinRequestsSectionProps<T>) {
  return (
    <section aria-labelledby={headingId} className="mb-6">
      <h2
        id={headingId}
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {titleText}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const id = getId(item);
          const coverUrl = getCoverUrl(item);
          return (
            <div
              key={id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <Link href={getHref(item)} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  {coverUrl && <img src={coverUrl} alt="" className="size-full object-cover" />}
                </div>
                <div className="min-w-50 flex-1">
                  <p className="truncate font-semibold text-sm">{getName(item)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(getInitiatedAt(item)).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </Link>
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onCancel(item)}
                  disabled={cancellingIds.has(id)}
                  title={cancelLabel}
                  aria-label={cancelLabel}
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Button>
                {errorIds.has(id) && <p className="text-xs text-destructive">{cancelErrorLabel}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
