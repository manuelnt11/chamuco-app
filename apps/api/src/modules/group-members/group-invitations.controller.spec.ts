import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupMembersService } from './group-members.service';
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

let mockListMyInvitations: jest.Mock;

describe('GroupInvitationsController', () => {
  let controller: GroupInvitationsController;

  beforeEach(async () => {
    mockListMyInvitations = jest.fn().mockResolvedValue([mockInvitationResponse]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupInvitationsController],
      providers: [
        {
          provide: GroupMembersService,
          useValue: { listMyInvitations: mockListMyInvitations },
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
});
