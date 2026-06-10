import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersLoyaltyProgramsService } from './users-loyalty-programs.service';
import type { LoyaltyProgramDto } from './dto/loyalty-program.dto';

const mockEmptyProfile = {
  userId: 'user-uuid',
  loyaltyPrograms: [],
};

describe('UsersLoyaltyProgramsService', () => {
  let service: UsersLoyaltyProgramsService;
  let mockProfileFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockProfileFindFirst = jest.fn();
    mockReturning = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersLoyaltyProgramsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              userProfiles: { findFirst: mockProfileFindFirst },
            },
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<UsersLoyaltyProgramsService>(UsersLoyaltyProgramsService);
  });

  describe('getLoyaltyPrograms', () => {
    it('returns the loyalty programs array from the profile', async () => {
      const programs = [
        { id: 'prog-uuid-1', programName: 'LifeMiles', memberId: 'LM123', notes: null },
      ];
      mockProfileFindFirst.mockResolvedValue({ ...mockEmptyProfile, loyaltyPrograms: programs });

      const result = await service.getLoyaltyPrograms('user-uuid');

      expect(result).toEqual(programs);
    });

    it('returns an empty array when the user has no programs', async () => {
      mockProfileFindFirst.mockResolvedValue(mockEmptyProfile);

      const result = await service.getLoyaltyPrograms('user-uuid');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getLoyaltyPrograms('user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addLoyaltyProgram', () => {
    const newProgram: LoyaltyProgramDto = {
      id: 'prog-new-uuid',
      programName: 'Delta SkyMiles',
      memberId: 'DL999',
      notes: null,
    };

    it('appends the new program and returns it', async () => {
      mockProfileFindFirst.mockResolvedValue(mockEmptyProfile);
      mockReturning.mockResolvedValue([{ ...mockEmptyProfile, loyaltyPrograms: [newProgram] }]);

      const result = await service.addLoyaltyProgram('user-uuid', newProgram);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ loyaltyPrograms: [newProgram] }),
      );
      expect(result).toEqual(newProgram);
    });

    it('appends to existing programs without removing them', async () => {
      const existing = {
        id: 'prog-existing',
        programName: 'LifeMiles',
        memberId: 'LM1',
        notes: null,
      };
      mockProfileFindFirst.mockResolvedValue({ ...mockEmptyProfile, loyaltyPrograms: [existing] });
      mockReturning.mockResolvedValue([
        { ...mockEmptyProfile, loyaltyPrograms: [existing, newProgram] },
      ]);

      await service.addLoyaltyProgram('user-uuid', newProgram);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ loyaltyPrograms: [existing, newProgram] }),
      );
    });

    it('throws ConflictException when programName+memberId already exists (exact match)', async () => {
      const duplicate = { ...newProgram, id: 'prog-other-uuid' };
      mockProfileFindFirst.mockResolvedValue({ ...mockEmptyProfile, loyaltyPrograms: [duplicate] });

      await expect(service.addLoyaltyProgram('user-uuid', newProgram)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when programName+memberId match case-insensitively', async () => {
      const existing = {
        ...newProgram,
        id: 'prog-other-uuid',
        programName: 'delta skymiles',
        memberId: 'dl999',
      };
      mockProfileFindFirst.mockResolvedValue({ ...mockEmptyProfile, loyaltyPrograms: [existing] });

      await expect(service.addLoyaltyProgram('user-uuid', newProgram)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when the update returns an empty array', async () => {
      mockProfileFindFirst.mockResolvedValue(mockEmptyProfile);
      mockReturning.mockResolvedValue([]);

      await expect(service.addLoyaltyProgram('user-uuid', newProgram)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.addLoyaltyProgram('user-uuid', newProgram)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateLoyaltyProgram', () => {
    const existingProgram: LoyaltyProgramDto = {
      id: 'prog-uuid',
      programName: 'LifeMiles',
      memberId: 'LM123',
      notes: null,
    };

    it('updates the specified fields and returns the updated program', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        loyaltyPrograms: [existingProgram],
      });
      const updated = { ...existingProgram, memberId: 'LM999' };
      mockReturning.mockResolvedValue([{ ...mockEmptyProfile, loyaltyPrograms: [updated] }]);

      const result = await service.updateLoyaltyProgram('user-uuid', 'prog-uuid', {
        memberId: 'LM999',
      });

      expect(result).toEqual(updated);
    });

    it('does not modify other programs in the array', async () => {
      const other = { id: 'prog-other', programName: 'Bonvoy', memberId: 'BV1', notes: null };
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        loyaltyPrograms: [existingProgram, other],
      });
      mockReturning.mockResolvedValue([
        { ...mockEmptyProfile, loyaltyPrograms: [{ ...existingProgram, notes: 'Gold' }, other] },
      ]);

      await service.updateLoyaltyProgram('user-uuid', 'prog-uuid', { notes: 'Gold' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          loyaltyPrograms: expect.arrayContaining([expect.objectContaining({ id: 'prog-other' })]),
        }),
      );
    });

    it('throws NotFoundException when the program id is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        loyaltyPrograms: [existingProgram],
      });

      await expect(
        service.updateLoyaltyProgram('user-uuid', 'nonexistent-uuid', { memberId: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the update returns an empty array', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        loyaltyPrograms: [existingProgram],
      });
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateLoyaltyProgram('user-uuid', 'prog-uuid', { memberId: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.updateLoyaltyProgram('user-uuid', 'prog-uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteLoyaltyProgram', () => {
    const program: LoyaltyProgramDto = {
      id: 'prog-uuid',
      programName: 'LifeMiles',
      memberId: 'LM123',
      notes: null,
    };

    it('removes the program and saves the remaining array', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockEmptyProfile, loyaltyPrograms: [program] });
      mockReturning.mockResolvedValue([{ ...mockEmptyProfile, loyaltyPrograms: [] }]);

      await service.deleteLoyaltyProgram('user-uuid', 'prog-uuid');

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ loyaltyPrograms: [] }));
    });

    it('throws NotFoundException when the program is not found', async () => {
      mockProfileFindFirst.mockResolvedValue(mockEmptyProfile);

      await expect(service.deleteLoyaltyProgram('user-uuid', 'prog-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteLoyaltyProgram('user-uuid', 'prog-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
