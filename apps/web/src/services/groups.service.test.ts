import {
  acceptGroupInvitation,
  acceptJoinRequest,
  cancelGroupInvitation,
  createAnnouncement,
  createGroup,
  declineGroupInvitation,
  deleteAnnouncement,
  deleteGroup,
  getGroup,
  getGroupAnnouncement,
  getGroupAnnouncements,
  getGroupMembers,
  getGroupMembership,
  getGroups,
  getMyGroupInvitations,
  getMyGroupJoinRequests,
  getPendingGroupMembers,
  inviteGroupMembers,
  joinGroup,
  leaveGroup,
  rejectJoinRequest,
  withdrawGroupJoinRequest,
  removeGroupMember,
  searchGroups,
  updateAnnouncement,
  updateGroup,
  updateMemberRole,
} from './groups.service';
import type {
  CreateGroupPayload,
  GroupMembershipResponse,
  UpdateGroupPayload,
} from '@/services/groups.types';
import type {
  Group,
  GroupAnnouncement,
  GroupAnnouncementsResponse,
  GroupInvitation,
  GroupMember,
  GroupSearchResponse,
  MyGroupJoinRequest,
  PendingGroupMember,
} from '@/types/group';
import {
  type BulkInvitationResponse,
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  GroupVisibility,
  MembershipStatus,
} from '@chamuco/shared-types';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { mockGet: get, mockPost: post, mockPatch: patch, mockDelete: del };
});

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const groupFixture: Group = {
  id: 'group-uuid-1',
  name: 'Los Viajeros',
  description: null,
  coverUrl: 'https://example.com/cover.jpg',
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-uuid-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const memberFixture: GroupMember = {
  userId: 'user-uuid-1',
  username: 'johndoe',
  displayName: 'John Doe',
  avatarUrl: null,
  role: GroupRole.MEMBER,
  tier: GroupMemberTier.EXPLORER,
  joinedAt: '2026-01-01T00:00:00.000Z',
};

const pendingMemberFixture: PendingGroupMember = {
  userId: 'user-uuid-2',
  username: 'janedoe',
  displayName: 'Jane Doe',
  avatarUrl: null,
  status: GroupMemberStatus.REQUEST,
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

const membershipFixture: GroupMembershipResponse = {
  status: GroupMemberStatus.ACTIVE,
  role: GroupRole.ADMIN,
};

const invitationFixture: GroupInvitation = {
  group: { id: 'group-uuid-1', name: 'Los Viajeros', coverUrl: 'https://example.com/cover.jpg' },
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

const announcementFixture: GroupAnnouncement = {
  id: 'announcement-uuid-1',
  groupId: 'group-uuid-1',
  createdByUsername: 'johndoe',
  content: 'Welcome to Los Viajeros!',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const announcementsPageFixture: GroupAnnouncementsResponse = {
  items: [announcementFixture],
  total: 1,
};

const searchResponseFixture: GroupSearchResponse = {
  data: [
    {
      ...groupFixture,
      memberCount: 5,
      membershipStatus: 'none' as MembershipStatus,
    },
  ],
  total: 1,
};

const createGroupPayload: CreateGroupPayload = {
  name: 'Los Viajeros',
  visibility: GroupVisibility.PUBLIC,
  cover: { source: 'emoji', target: '🌍' },
};

const updateGroupPayload: UpdateGroupPayload = {
  name: 'Updated Name',
};

const inviteResponseFixture: BulkInvitationResponse = {
  results: [{ username: 'janedoe', status: 'INVITED' }],
};

// ─── Group methods ────────────────────────────────────────────────────────────

describe('getGroups', () => {
  it('gets /v1/groups and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [groupFixture] });
    const result = await getGroups();
    expect(mockGet).toHaveBeenCalledWith('/v1/groups');
    expect(result).toEqual([groupFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getGroups()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getGroups()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('getGroup', () => {
  it('gets /v1/groups/:id and returns the group', async () => {
    mockGet.mockResolvedValueOnce({ data: groupFixture });
    const result = await getGroup('group-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/group-uuid-1');
    expect(result).toEqual(groupFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getGroup('group-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getGroup('group-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('createGroup', () => {
  it('posts to /v1/groups and returns the group', async () => {
    mockPost.mockResolvedValueOnce({ data: groupFixture });
    const result = await createGroup(createGroupPayload);
    expect(mockPost).toHaveBeenCalledWith('/v1/groups', createGroupPayload);
    expect(result).toEqual(groupFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createGroup(createGroupPayload)).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(createGroup(createGroupPayload)).rejects.toEqual({ response: { status: 422 } });
  });
});

describe('updateGroup', () => {
  it('patches /v1/groups/:id and returns the group', async () => {
    mockPatch.mockResolvedValueOnce({ data: groupFixture });
    const result = await updateGroup('group-uuid-1', updateGroupPayload);
    expect(mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid-1', updateGroupPayload);
    expect(result).toEqual(groupFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateGroup('group-uuid-1', {})).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateGroup('group-uuid-1', {})).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('deleteGroup', () => {
  it('deletes /v1/groups/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteGroup('group-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/groups/group-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteGroup('group-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteGroup('group-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

// ─── Member methods ───────────────────────────────────────────────────────────

describe('getGroupMembers', () => {
  it('gets /v1/groups/:id/members and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [memberFixture] });
    const result = await getGroupMembers('group-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/group-uuid-1/members');
    expect(result).toEqual([memberFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getGroupMembers('group-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getGroupMembers('group-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('getGroupMembership', () => {
  it('gets /v1/groups/:id/members/me and returns the membership', async () => {
    mockGet.mockResolvedValueOnce({ data: membershipFixture });
    const result = await getGroupMembership('group-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/group-uuid-1/members/me');
    expect(result).toEqual(membershipFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getGroupMembership('group-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getGroupMembership('group-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('updateMemberRole', () => {
  it('patches /v1/groups/:groupId/members/:userId/role with the role', async () => {
    mockPatch.mockResolvedValueOnce({});
    await updateMemberRole('group-uuid-1', 'user-uuid-1', GroupRole.ADMIN);
    expect(mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid-1/members/user-uuid-1/role', {
      role: GroupRole.ADMIN,
    });
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMemberRole('group-uuid-1', 'user-uuid-1', GroupRole.MEMBER)).rejects.toEqual(
      { response: { status: 401 } },
    );
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateMemberRole('group-uuid-1', 'user-uuid-1', GroupRole.MEMBER)).rejects.toEqual(
      { response: { status: 404 } },
    );
  });
});

describe('removeGroupMember', () => {
  it('deletes /v1/groups/:groupId/members/:userId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await removeGroupMember('group-uuid-1', 'user-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/groups/group-uuid-1/members/user-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(removeGroupMember('group-uuid-1', 'user-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(removeGroupMember('group-uuid-1', 'user-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('joinGroup', () => {
  it('posts to /v1/groups/:groupId/join-request', async () => {
    mockPost.mockResolvedValueOnce({});
    await joinGroup('group-uuid-1');
    expect(mockPost).toHaveBeenCalledWith('/v1/groups/group-uuid-1/join-request');
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(joinGroup('group-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(joinGroup('group-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('leaveGroup', () => {
  it('deletes /v1/groups/:groupId/members/:userId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await leaveGroup('group-uuid-1', 'user-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/groups/group-uuid-1/members/user-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(leaveGroup('group-uuid-1', 'user-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(leaveGroup('group-uuid-1', 'user-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('getMyGroupJoinRequests', () => {
  it('gets /v1/groups/join-requests/mine and returns the list', async () => {
    const mockRequests: MyGroupJoinRequest[] = [
      {
        groupId: 'group-uuid-1',
        name: 'Mountain Crew',
        coverUrl: 'https://cdn.example.com/cover.jpg',
        visibility: GroupVisibility.PUBLIC,
        initiatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    mockGet.mockResolvedValueOnce({ data: mockRequests });
    const result = await getMyGroupJoinRequests();
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/join-requests/mine');
    expect(result).toEqual(mockRequests);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyGroupJoinRequests()).rejects.toEqual({ response: { status: 401 } });
  });
});

describe('withdrawGroupJoinRequest', () => {
  it('deletes /v1/groups/:groupId/join-request', async () => {
    mockDelete.mockResolvedValueOnce({});
    await withdrawGroupJoinRequest('group-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/groups/group-uuid-1/join-request');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(withdrawGroupJoinRequest('group-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 409 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 409 } });
    await expect(withdrawGroupJoinRequest('group-uuid-1')).rejects.toEqual({
      response: { status: 409 },
    });
  });
});

// ─── Join request methods ─────────────────────────────────────────────────────

describe('acceptJoinRequest', () => {
  it('patches /v1/groups/:groupId/join-requests/:userId/accept', async () => {
    mockPatch.mockResolvedValueOnce({});
    await acceptJoinRequest('group-uuid-1', 'user-uuid-2');
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/groups/group-uuid-1/join-requests/user-uuid-2/accept',
    );
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(acceptJoinRequest('group-uuid-1', 'user-uuid-2')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(acceptJoinRequest('group-uuid-1', 'user-uuid-2')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('rejectJoinRequest', () => {
  it('patches /v1/groups/:groupId/join-requests/:userId/reject', async () => {
    mockPatch.mockResolvedValueOnce({});
    await rejectJoinRequest('group-uuid-1', 'user-uuid-2');
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/groups/group-uuid-1/join-requests/user-uuid-2/reject',
    );
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(rejectJoinRequest('group-uuid-1', 'user-uuid-2')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(rejectJoinRequest('group-uuid-1', 'user-uuid-2')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Invitation methods ───────────────────────────────────────────────────────

describe('getMyGroupInvitations', () => {
  it('gets /v1/groups/invitations and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [invitationFixture] });
    const result = await getMyGroupInvitations();
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/invitations');
    expect(result).toEqual([invitationFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyGroupInvitations()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyGroupInvitations()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('inviteGroupMembers', () => {
  it('posts to /v1/groups/:groupId/invitations and returns the result', async () => {
    mockPost.mockResolvedValueOnce({ data: inviteResponseFixture });
    const dto = { usernames: ['janedoe'] };
    const result = await inviteGroupMembers('group-uuid-1', dto);
    expect(mockPost).toHaveBeenCalledWith('/v1/groups/group-uuid-1/invitations', dto);
    expect(result).toEqual(inviteResponseFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(inviteGroupMembers('group-uuid-1', { usernames: ['janedoe'] })).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(inviteGroupMembers('group-uuid-1', { usernames: ['janedoe'] })).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('acceptGroupInvitation', () => {
  it('patches /v1/groups/:groupId/invitations/accept', async () => {
    mockPatch.mockResolvedValueOnce({});
    await acceptGroupInvitation('group-uuid-1');
    expect(mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid-1/invitations/accept');
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(acceptGroupInvitation('group-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(acceptGroupInvitation('group-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('declineGroupInvitation', () => {
  it('patches /v1/groups/:groupId/invitations/decline', async () => {
    mockPatch.mockResolvedValueOnce({});
    await declineGroupInvitation('group-uuid-1');
    expect(mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid-1/invitations/decline');
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(declineGroupInvitation('group-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(declineGroupInvitation('group-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('cancelGroupInvitation', () => {
  it('deletes /v1/groups/:groupId/invitations/:userId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await cancelGroupInvitation('group-uuid-1', 'user-uuid-2');
    expect(mockDelete).toHaveBeenCalledWith('/v1/groups/group-uuid-1/invitations/user-uuid-2');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(cancelGroupInvitation('group-uuid-1', 'user-uuid-2')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(cancelGroupInvitation('group-uuid-1', 'user-uuid-2')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Announcement methods ─────────────────────────────────────────────────────

describe('getGroupAnnouncements', () => {
  it('gets /v1/groups/:groupId/announcements with pagination and returns the response', async () => {
    mockGet.mockResolvedValueOnce({ data: announcementsPageFixture });
    const result = await getGroupAnnouncements('group-uuid-1', 10, 0);
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/group-uuid-1/announcements', {
      params: { limit: 10, offset: 0 },
    });
    expect(result).toEqual(announcementsPageFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getGroupAnnouncements('group-uuid-1', 10, 0)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getGroupAnnouncements('group-uuid-1', 10, 0)).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('getGroupAnnouncement', () => {
  it('gets /v1/groups/:groupId/announcements/:announcementId and returns the announcement', async () => {
    mockGet.mockResolvedValueOnce({ data: announcementFixture });
    const result = await getGroupAnnouncement('group-uuid-1', 'announcement-uuid-1');
    expect(mockGet).toHaveBeenCalledWith(
      '/v1/groups/group-uuid-1/announcements/announcement-uuid-1',
    );
    expect(result).toEqual(announcementFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getGroupAnnouncement('group-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getGroupAnnouncement('group-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('createAnnouncement', () => {
  it('posts to /v1/groups/:groupId/announcements and returns the announcement', async () => {
    mockPost.mockResolvedValueOnce({ data: announcementFixture });
    const dto = { content: 'Welcome to Los Viajeros!' };
    const result = await createAnnouncement('group-uuid-1', dto);
    expect(mockPost).toHaveBeenCalledWith('/v1/groups/group-uuid-1/announcements', dto);
    expect(result).toEqual(announcementFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createAnnouncement('group-uuid-1', { content: 'Hello' })).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(createAnnouncement('group-uuid-1', { content: 'Hello' })).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('updateAnnouncement', () => {
  it('patches /v1/groups/:groupId/announcements/:announcementId and returns the announcement', async () => {
    mockPatch.mockResolvedValueOnce({ data: announcementFixture });
    const dto = { content: 'Updated content' };
    const result = await updateAnnouncement('group-uuid-1', 'announcement-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/groups/group-uuid-1/announcements/announcement-uuid-1',
      dto,
    );
    expect(result).toEqual(announcementFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      updateAnnouncement('group-uuid-1', 'announcement-uuid-1', { content: 'x' }),
    ).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(
      updateAnnouncement('group-uuid-1', 'announcement-uuid-1', { content: 'x' }),
    ).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('deleteAnnouncement', () => {
  it('deletes /v1/groups/:groupId/announcements/:announcementId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteAnnouncement('group-uuid-1', 'announcement-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith(
      '/v1/groups/group-uuid-1/announcements/announcement-uuid-1',
    );
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteAnnouncement('group-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteAnnouncement('group-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Pending members ──────────────────────────────────────────────────────────

describe('getPendingGroupMembers', () => {
  it('gets /v1/groups/:groupId/pending and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [pendingMemberFixture] });
    const result = await getPendingGroupMembers('group-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/group-uuid-1/pending');
    expect(result).toEqual([pendingMemberFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getPendingGroupMembers('group-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getPendingGroupMembers('group-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('searchGroups', () => {
  it('gets /v1/groups/search with params and returns the response', async () => {
    mockGet.mockResolvedValueOnce({ data: searchResponseFixture });
    const params = { q: 'viajeros', limit: 10 };
    const result = await searchGroups(params);
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/search', {
      params,
      signal: undefined,
    });
    expect(result).toEqual(searchResponseFixture);
  });

  it('passes AbortSignal when provided', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ data: searchResponseFixture });
    await searchGroups({ q: 'viajeros' }, controller.signal);
    expect(mockGet).toHaveBeenCalledWith('/v1/groups/search', {
      params: { q: 'viajeros' },
      signal: controller.signal,
    });
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(searchGroups({ q: 'viajeros' })).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(searchGroups({ q: 'viajeros' })).rejects.toEqual({ response: { status: 404 } });
  });
});
