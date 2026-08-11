import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';

import { GroupJoinRequestsController } from './group-join-requests.controller';
import { GroupJoinRequestsService } from './group-join-requests.service';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'admin-uuid',
  username: 'admin',
  displayName: 'Admin',
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

describe('GroupJoinRequestsController', () => {
  let controller: GroupJoinRequestsController;
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
      controllers: [GroupJoinRequestsController],
      providers: [
        {
          provide: GroupJoinRequestsService,
          useValue: {
            submitJoinRequest: mockSubmitJoinRequest,
            acceptJoinRequest: mockAcceptJoinRequest,
            rejectJoinRequest: mockRejectJoinRequest,
            withdrawJoinRequest: mockWithdrawJoinRequest,
          },
        },
      ],
    }).compile();

    controller = module.get<GroupJoinRequestsController>(GroupJoinRequestsController);
  });

  it('submitJoinRequest delegates to service', async () => {
    await controller.submitJoinRequest(mockAuthUser, 'group-uuid');

    expect(mockSubmitJoinRequest).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
  });

  it('acceptJoinRequest delegates to service', async () => {
    await controller.acceptJoinRequest(mockAuthUser, 'group-uuid', 'user-uuid');

    expect(mockAcceptJoinRequest).toHaveBeenCalledWith('group-uuid', 'user-uuid', mockAuthUser.id);
  });

  it('rejectJoinRequest delegates to service', async () => {
    await controller.rejectJoinRequest(mockAuthUser, 'group-uuid', 'user-uuid');

    expect(mockRejectJoinRequest).toHaveBeenCalledWith('group-uuid', 'user-uuid', mockAuthUser.id);
  });

  it('withdrawJoinRequest delegates to service', async () => {
    await controller.withdrawJoinRequest(mockAuthUser, 'group-uuid');

    expect(mockWithdrawJoinRequest).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
  });
});
