'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TripStatus } from '@chamuco/shared-types';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  InfoIcon,
  CheckCircleIcon,
  ProhibitIcon,
} from '@phosphor-icons/react';

import { TripStatusBadge } from '@/components/trips/TripStatusBadge';

const MAIN_FLOW: TripStatus[] = [
  TripStatus.DRAFT,
  TripStatus.OPEN,
  TripStatus.CONFIRMED,
  TripStatus.IN_PROGRESS,
  TripStatus.COMPLETED,
];

const STATUS_GUIDE_KEYS: Record<
  TripStatus,
  { intent: string; conditions: string; restrictions: string }
> = {
  [TripStatus.DRAFT]: {
    intent: 'statusGuide.draft.intent',
    conditions: 'statusGuide.draft.conditions',
    restrictions: 'statusGuide.draft.restrictions',
  },
  [TripStatus.OPEN]: {
    intent: 'statusGuide.open.intent',
    conditions: 'statusGuide.open.conditions',
    restrictions: 'statusGuide.open.restrictions',
  },
  [TripStatus.CONFIRMED]: {
    intent: 'statusGuide.confirmed.intent',
    conditions: 'statusGuide.confirmed.conditions',
    restrictions: 'statusGuide.confirmed.restrictions',
  },
  [TripStatus.IN_PROGRESS]: {
    intent: 'statusGuide.inProgress.intent',
    conditions: 'statusGuide.inProgress.conditions',
    restrictions: 'statusGuide.inProgress.restrictions',
  },
  [TripStatus.COMPLETED]: {
    intent: 'statusGuide.completed.intent',
    conditions: 'statusGuide.completed.conditions',
    restrictions: 'statusGuide.completed.restrictions',
  },
  [TripStatus.CANCELLED]: {
    intent: 'statusGuide.cancelled.intent',
    conditions: 'statusGuide.cancelled.conditions',
    restrictions: 'statusGuide.cancelled.restrictions',
  },
};

const TERMINAL_STATUSES = new Set([TripStatus.COMPLETED, TripStatus.CANCELLED]);

export default function TripStatusGuidePage() {
  const router = useRouter();
  const { t } = useTranslation('trips');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('common:actions.back')}
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          <span>{t('common:actions.back')}</span>
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t('statusGuide.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('statusGuide.subtitle')}</p>
        </div>

        <section className="mb-10">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            {MAIN_FLOW.map((status, index) => (
              <div key={status} className="flex items-center gap-2">
                <TripStatusBadge status={status} hideGuideLink />
                {index < MAIN_FLOW.length - 1 && (
                  <>
                    <ArrowRightIcon
                      className="hidden size-4 shrink-0 text-muted-foreground sm:block"
                      aria-hidden="true"
                    />
                    <ArrowDownIcon
                      className="size-4 shrink-0 text-muted-foreground sm:hidden"
                      aria-hidden="true"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t('statusGuide.cancelledNote')}</p>
        </section>

        <div className="space-y-4">
          {MAIN_FLOW.map((status) => (
            <StatusCard key={status} status={status} t={t} />
          ))}
          <StatusCard status={TripStatus.CANCELLED} t={t} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  status,
  t,
}: {
  status: TripStatus;
  t: ReturnType<typeof useTranslation<'trips'>>['t'];
}) {
  const keys = STATUS_GUIDE_KEYS[status];
  const isTerminal = TERMINAL_STATUSES.has(status);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <TripStatusBadge status={status} hideGuideLink />
        {isTerminal && (
          <span className="text-xs text-muted-foreground">{t('statusGuide.terminalLabel')}</span>
        )}
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <InfoIcon
            className="mt-0.5 size-4 shrink-0 text-blue-500 dark:text-blue-400"
            aria-hidden="true"
          />
          <div>
            <span className="font-medium text-foreground">{t('statusGuide.intentLabel')}: </span>
            <span className="text-muted-foreground">{t(keys.intent)}</span>
          </div>
        </li>

        <li className="flex items-start gap-2">
          <CheckCircleIcon
            className="mt-0.5 size-4 shrink-0 text-green-500 dark:text-green-400"
            aria-hidden="true"
          />
          <div>
            <span className="font-medium text-foreground">
              {t('statusGuide.conditionsLabel')}:{' '}
            </span>
            <span className="text-muted-foreground">{t(keys.conditions)}</span>
          </div>
        </li>

        <li className="flex items-start gap-2">
          <ProhibitIcon
            className="mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400"
            aria-hidden="true"
          />
          <div>
            <span className="font-medium text-foreground">
              {t('statusGuide.restrictionsLabel')}:{' '}
            </span>
            <span className="text-muted-foreground">{t(keys.restrictions)}</span>
          </div>
        </li>
      </ul>
    </div>
  );
}
