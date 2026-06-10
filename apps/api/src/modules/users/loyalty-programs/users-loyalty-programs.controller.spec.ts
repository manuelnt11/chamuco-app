import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { UsersLoyaltyProgramsController } from './users-loyalty-programs.controller';
import { UsersLoyaltyProgramsService } from './users-loyalty-programs.service';
import type { AuthenticatedUser } from '@/types/express';
import type { LoyaltyProgramDto, UpdateLoyaltyProgramDto } from './dto/loyalty-program.dto';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockProgram: LoyaltyProgramDto = {
  id: 'prog-uuid',
  programName: 'LifeMiles',
  memberId: 'LM123',
  notes: null,
};

describe('UsersLoyaltyProgramsController', () => {
  let controller: UsersLoyaltyProgramsController;
  let mockGetLoyaltyPrograms: jest.Mock;
  let mockAddLoyaltyProgram: jest.Mock;
  let mockUpdateLoyaltyProgram: jest.Mock;
  let mockDeleteLoyaltyProgram: jest.Mock;

  beforeEach(async () => {
    mockGetLoyaltyPrograms = jest.fn().mockResolvedValue([mockProgram]);
    mockAddLoyaltyProgram = jest.fn().mockResolvedValue(mockProgram);
    mockUpdateLoyaltyProgram = jest.fn().mockResolvedValue(mockProgram);
    mockDeleteLoyaltyProgram = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersLoyaltyProgramsController],
      providers: [
        {
          provide: UsersLoyaltyProgramsService,
          useValue: {
            getLoyaltyPrograms: mockGetLoyaltyPrograms,
            addLoyaltyProgram: mockAddLoyaltyProgram,
            updateLoyaltyProgram: mockUpdateLoyaltyProgram,
            deleteLoyaltyProgram: mockDeleteLoyaltyProgram,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersLoyaltyProgramsController>(UsersLoyaltyProgramsController);
  });

  describe('GET /v1/users/me/loyalty-programs', () => {
    it('delegates to service and returns the programs array', async () => {
      const result = await controller.getLoyaltyPrograms(mockAuthUser);

      expect(mockGetLoyaltyPrograms).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockProgram]);
    });
  });

  describe('POST /v1/users/me/loyalty-programs', () => {
    it('delegates to service and returns the new program', async () => {
      const result = await controller.addLoyaltyProgram(mockAuthUser, mockProgram);

      expect(mockAddLoyaltyProgram).toHaveBeenCalledWith(mockAuthUser.id, mockProgram);
      expect(result).toEqual(mockProgram);
    });
  });

  describe('PATCH /v1/users/me/loyalty-programs/:programId', () => {
    it('delegates to service and returns the updated program', async () => {
      const dto: UpdateLoyaltyProgramDto = { memberId: 'LM999' };
      const result = await controller.updateLoyaltyProgram(mockAuthUser, 'prog-uuid', dto);

      expect(mockUpdateLoyaltyProgram).toHaveBeenCalledWith(mockAuthUser.id, 'prog-uuid', dto);
      expect(result).toEqual(mockProgram);
    });
  });

  describe('DELETE /v1/users/me/loyalty-programs/:programId', () => {
    it('delegates to service and returns undefined', async () => {
      const result = await controller.deleteLoyaltyProgram(mockAuthUser, 'prog-uuid');

      expect(mockDeleteLoyaltyProgram).toHaveBeenCalledWith(mockAuthUser.id, 'prog-uuid');
      expect(result).toBeUndefined();
    });
  });
});
