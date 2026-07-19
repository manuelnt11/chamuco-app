import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';

import { TripInvitationsController } from './trip-invitations.controller';
import { TripInvitationsService } from './trip-invitations.service';
import type { CreateTripInvitationDto } from './dto/create-trip-invitation.dto';
import type { BulkTripInvitationResponseDto } from './dto/bulk-trip-invitation-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'organizer-uuid',
  username: 'organizer',
  displayName: 'Organizer',
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

describe('TripInvitationsController', () => {
  let controller: TripInvitationsController;
  let mockSendInvitations: jest.Mock;
  let mockAcceptInvitation: jest.Mock;
  let mockDeclineInvitation: jest.Mock;
  let mockRevokeInvitation: jest.Mock;

  beforeEach(async () => {
    mockSendInvitations = jest
      .fn()
      .mockResolvedValue({ results: [] } as BulkTripInvitationResponseDto);
    mockAcceptInvitation = jest.fn().mockResolvedValue(undefined);
    mockDeclineInvitation = jest.fn().mockResolvedValue(undefined);
    mockRevokeInvitation = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripInvitationsController],
      providers: [
        {
          provide: TripInvitationsService,
          useValue: {
            sendInvitations: mockSendInvitations,
            acceptInvitation: mockAcceptInvitation,
            declineInvitation: mockDeclineInvitation,
            revokeInvitation: mockRevokeInvitation,
          },
        },
      ],
    }).compile();

    controller = module.get<TripInvitationsController>(TripInvitationsController);
  });

  describe('POST /v1/trips/:id/invitations', () => {
    it('delegates to service.sendInvitations and returns result', async () => {
      const dto: CreateTripInvitationDto = { usernames: ['target_user'] };
      const mockResult: BulkTripInvitationResponseDto = {
        results: [{ username: 'target_user', status: 'INVITED' }],
      };
      mockSendInvitations.mockResolvedValueOnce(mockResult);

      const result = await controller.sendInvitations(mockAuthUser, 'trip-uuid', dto);

      expect(mockSendInvitations).toHaveBeenCalledWith('trip-uuid', dto, mockAuthUser.id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('PATCH /v1/trips/:id/invitations/accept', () => {
    it('delegates to service.acceptInvitation', async () => {
      await controller.acceptInvitation(mockAuthUser, 'trip-uuid');

      expect(mockAcceptInvitation).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
    });
  });

  describe('PATCH /v1/trips/:id/invitations/decline', () => {
    it('delegates to service.declineInvitation', async () => {
      await controller.declineInvitation(mockAuthUser, 'trip-uuid');

      expect(mockDeclineInvitation).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
    });
  });

  describe('DELETE /v1/trips/:id/invitations/:userId', () => {
    it('delegates to service.revokeInvitation', async () => {
      await controller.revokeInvitation(mockAuthUser, 'trip-uuid', 'user-uuid');

      expect(mockRevokeInvitation).toHaveBeenCalledWith('trip-uuid', 'user-uuid', mockAuthUser.id);
    });
  });
});
