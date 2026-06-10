import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupMembersService } from './group-members.service';
import { GroupInvitationsService } from './group-invitations.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { BulkInvitationResponseDto } from './dto/bulk-invitation-response.dto';
import type { MyInvitationResponseDto } from './dto/my-invitation-response.dto';
import type { AuthenticatedUser } from '@/types/express';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'user',
  displayName: 'User',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockInvitationResponse: MyInvitationResponseDto = {
  group: {
    id: 'group-uuid',
    name: 'Mountain Crew',
    coverUrl: 'https://cdn.jsdelivr.net/npm/twemoji/2/svg/26f0.svg',
  },
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

describe('GroupInvitationsController', () => {
  let controller: GroupInvitationsController;
  let mockListMyInvitations: jest.Mock;
  let mockSendInvitations: jest.Mock;
  let mockAcceptInvitation: jest.Mock;
  let mockDeclineInvitation: jest.Mock;
  let mockRevokeInvitation: jest.Mock;

  beforeEach(async () => {
    mockListMyInvitations = jest.fn().mockResolvedValue([mockInvitationResponse]);
    mockSendInvitations = jest.fn().mockResolvedValue({ results: [] } as BulkInvitationResponseDto);
    mockAcceptInvitation = jest.fn().mockResolvedValue(undefined);
    mockDeclineInvitation = jest.fn().mockResolvedValue(undefined);
    mockRevokeInvitation = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupInvitationsController],
      providers: [
        {
          provide: GroupMembersService,
          useValue: { listMyInvitations: mockListMyInvitations },
        },
        {
          provide: GroupInvitationsService,
          useValue: {
            sendInvitations: mockSendInvitations,
            acceptInvitation: mockAcceptInvitation,
            declineInvitation: mockDeclineInvitation,
            revokeInvitation: mockRevokeInvitation,
          },
        },
      ],
    }).compile();

    controller = module.get<GroupInvitationsController>(GroupInvitationsController);
  });

  describe('GET /v1/groups/invitations', () => {
    it('delegates to GroupMembersService.listMyInvitations with caller id', async () => {
      const result = await controller.listMyInvitations(mockAuthUser);

      expect(mockListMyInvitations).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockInvitationResponse]);
    });

    it('returns empty array when user has no pending invitations', async () => {
      mockListMyInvitations.mockResolvedValue([]);

      const result = await controller.listMyInvitations(mockAuthUser);

      expect(result).toEqual([]);
    });
  });

  describe('POST /v1/groups/:id/invitations', () => {
    it('delegates to GroupInvitationsService.sendInvitations and returns result', async () => {
      const dto: CreateInvitationDto = { usernames: ['target_user'] };
      const mockResult: BulkInvitationResponseDto = {
        results: [{ username: 'target_user', status: 'INVITED' }],
      };
      mockSendInvitations.mockResolvedValueOnce(mockResult);

      const result = await controller.sendInvitations(mockAuthUser, 'group-uuid', dto);

      expect(mockSendInvitations).toHaveBeenCalledWith('group-uuid', dto, mockAuthUser.id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('PATCH /v1/groups/:id/invitations/accept', () => {
    it('delegates to GroupInvitationsService.acceptInvitation', async () => {
      await controller.acceptInvitation(mockAuthUser, 'group-uuid');

      expect(mockAcceptInvitation).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
    });
  });

  describe('PATCH /v1/groups/:id/invitations/decline', () => {
    it('delegates to GroupInvitationsService.declineInvitation', async () => {
      await controller.declineInvitation(mockAuthUser, 'group-uuid');

      expect(mockDeclineInvitation).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
    });
  });

  describe('DELETE /v1/groups/:id/invitations/:userId', () => {
    it('delegates to GroupInvitationsService.revokeInvitation', async () => {
      await controller.revokeInvitation(mockAuthUser, 'group-uuid', 'user-uuid');

      expect(mockRevokeInvitation).toHaveBeenCalledWith('group-uuid', 'user-uuid', mockAuthUser.id);
    });
  });
});
