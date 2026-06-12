import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));
import { TripJoinRequestsController } from './trip-join-requests.controller';
import { TripJoinRequestsService } from './trip-join-requests.service';
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

describe('TripJoinRequestsController', () => {
  let controller: TripJoinRequestsController;
  let mockSubmitJoinRequest: jest.Mock;
  let mockAcceptJoinRequest: jest.Mock;
  let mockRejectJoinRequest: jest.Mock;
  let mockWithdrawJoinRequest: jest.Mock;

  beforeEach(async () => {
    mockSubmitJoinRequest = jest.fn().mockResolvedValue(undefined);
    mockAcceptJoinRequest = jest.fn().mockResolvedValue(undefined);
    mockRejectJoinRequest = jest.fn().mockResolvedValue(undefined);
    mockWithdrawJoinRequest = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripJoinRequestsController],
      providers: [
        {
          provide: TripJoinRequestsService,
          useValue: {
            submitJoinRequest: mockSubmitJoinRequest,
            acceptJoinRequest: mockAcceptJoinRequest,
            rejectJoinRequest: mockRejectJoinRequest,
            withdrawJoinRequest: mockWithdrawJoinRequest,
          },
        },
      ],
    }).compile();

    controller = module.get<TripJoinRequestsController>(TripJoinRequestsController);
  });

  describe('POST /v1/trips/:id/join-request', () => {
    it('delegates to service.submitJoinRequest', async () => {
      await controller.submitJoinRequest(mockAuthUser, 'trip-uuid');

      expect(mockSubmitJoinRequest).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
    });
  });

  describe('PATCH /v1/trips/:id/join-requests/:userId/accept', () => {
    it('delegates to service.acceptJoinRequest', async () => {
      await controller.acceptJoinRequest(mockAuthUser, 'trip-uuid', 'user-uuid');

      expect(mockAcceptJoinRequest).toHaveBeenCalledWith('trip-uuid', 'user-uuid', mockAuthUser.id);
    });
  });

  describe('PATCH /v1/trips/:id/join-requests/:userId/reject', () => {
    it('delegates to service.rejectJoinRequest', async () => {
      await controller.rejectJoinRequest(mockAuthUser, 'trip-uuid', 'user-uuid');

      expect(mockRejectJoinRequest).toHaveBeenCalledWith('trip-uuid', 'user-uuid', mockAuthUser.id);
    });
  });

  describe('DELETE /v1/trips/:id/join-request', () => {
    it('delegates to service.withdrawJoinRequest', async () => {
      await controller.withdrawJoinRequest(mockAuthUser, 'trip-uuid');

      expect(mockWithdrawJoinRequest).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
    });
  });
});
