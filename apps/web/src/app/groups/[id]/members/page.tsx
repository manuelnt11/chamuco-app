'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { GroupRole, GroupVisibility } from '@chamuco/shared-types';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { MemberList } from '@/components/groups/members/MemberList';
import { PendingRequestsPanel } from '@/components/groups/members/PendingRequestsPanel';
import { JoinRequestButton } from '@/components/groups/members/JoinRequestButton';
import { LeaveGroupButton } from '@/components/groups/members/LeaveGroupButton';
import type { Group, GroupMember, PendingGroupMember } from '@/types/group';

interface MembersPageProps {
  params: Promise<{ id: string }>;
}

type PageState =
  | 'loading'
  | 'not-found'
  | 'not-member' // active members only
  | 'ready';

export default function GroupMembersPage({ params }: MembersPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('groups');
  const { isLoading: isAuthLoading } = useAuth();
  const { appUser } = useUser();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pending, setPending] = useState<PendingGroupMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<GroupRole | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const isAdmin =
    currentUserRole !== null && [GroupRole.OWNER, GroupRole.ADMIN].includes(currentUserRole);

  const loadData = async () => {
    try {
      const [groupRes, membersRes] = await Promise.all([
        apiClient.get<Group>(`/v1/groups/${id}`),
        apiClient.get<GroupMember[]>(`/v1/groups/${id}/members`).catch(() => null),
      ]);

      setGroup(groupRes.data);

      if (!membersRes) {
        // 403 → not an active member
        setPageState('not-member');
        return;
      }

      setMembers(membersRes.data);

      const me = appUser ? membersRes.data.find((m) => m.userId === appUser.id) : undefined;
      setCurrentUserRole(me?.role ?? null);

      // Load pending for admins
      if (me && [GroupRole.OWNER, GroupRole.ADMIN].includes(me.role)) {
        const pendingRes = await apiClient
          .get<PendingGroupMember[]>(`/v1/groups/${id}/pending`)
          .catch(() => null);
        if (pendingRes) setPending(pendingRes.data);
      }

      setPageState('ready');
    } catch {
      setPageState('not-found');
    }
  };

  const loadNonMemberState = async () => {
    // Check for pending join request in the pending list (accessible to admins only)
    // For non-members we can't fetch pending, so we just mark hasPendingRequest=false
    // The backend will return ConflictException if they try to submit again
    setHasPendingRequest(false);
  };

  useEffect(() => {
    if (isAuthLoading) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthLoading]);

  useEffect(() => {
    if (pageState === 'not-member') {
      void loadNonMemberState();
    }
  }, [pageState]);

  if (pageState === 'loading') return null;

  if (pageState === 'not-found' || !group) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('errors.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {group.name}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('members.title')}</h1>

        {pageState === 'not-member' && group.visibility === GroupVisibility.PUBLIC && (
          <JoinRequestButton
            groupId={id}
            hasPendingRequest={hasPendingRequest}
            onSuccess={() => void loadData()}
          />
        )}

        {pageState === 'ready' && appUser && currentUserRole !== null && (
          <LeaveGroupButton groupId={id} userId={appUser.id} />
        )}
      </div>

      {pageState === 'not-member' && (
        <p className="text-sm text-muted-foreground">{t('errors.forbidden')}</p>
      )}

      {pageState === 'ready' && (
        <>
          {isAdmin && pending.length > 0 && (
            <PendingRequestsPanel groupId={id} items={pending} onUpdate={() => void loadData()} />
          )}

          <MemberList
            groupId={id}
            members={members}
            currentUserRole={currentUserRole}
            onInviteSuccess={() => void loadData()}
          />
        </>
      )}
    </div>
  );
}
