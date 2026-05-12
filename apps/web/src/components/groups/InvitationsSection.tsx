'use client';

import { useTranslation } from 'react-i18next';
import { useGroupInvitations } from '@/store/group-invitations';
import { InvitationResponseButtons } from '@/components/groups/members/InvitationResponseButtons';

export function InvitationsSection() {
  const { t } = useTranslation('groups');
  const { invitations, count, refresh } = useGroupInvitations();

  if (count === 0) return null;

  return (
    <section aria-labelledby="invitations-heading" className="mb-8 pb-8 border-b border-border">
      <h2
        id="invitations-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-500"
      >
        {t('invitations.titleWithCount', { count })}
      </h2>
      <div className="flex flex-col gap-3">
        {invitations.map(({ group, initiatedAt }) => (
          <div
            key={group.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20"
          >
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              <img src={group.coverUrl} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-50 flex-1">
              <p className="truncate font-semibold text-sm">{group.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(initiatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <InvitationResponseButtons
                groupId={group.id}
                onSuccess={refresh}
                showMessage={false}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
