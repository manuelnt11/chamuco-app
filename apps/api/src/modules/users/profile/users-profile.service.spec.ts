import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DietaryPreference } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersProfileService } from './users-profile.service';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';

const mockProfileRow = {
  userId: 'user-uuid',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 1, month: 1, year: 1990, year_visible: true },
  birthCountry: null,
  birthCity: null,
  homeCountry: 'CO',
  homeCity: null,
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  phoneVerified: false,
  email: 'test@example.com',
  emailVerified: false,
  bio: null,
  bloodType: null,
  dietaryPreference: DietaryPreference.OMNIVORE,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
  emergencyContacts: [],
  loyaltyPrograms: [],
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('UsersProfileService', () => {
  let service: UsersProfileService;
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
        UsersProfileService,
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

    service = module.get<UsersProfileService>(UsersProfileService);
  });

  describe('getProfile', () => {
    it('returns the mapped profile response when found', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);

      const result = await service.getProfile('user-uuid');

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.homeCountry).toBe('CO');
      expect(result.phoneCountryCode).toBe('+57');
      expect(result.phoneLocalNumber).toBe('3001234567');
    });

    it('translates year_visible to yearVisible in the response', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);

      const result = await service.getProfile('user-uuid');

      expect(result.dateOfBirth).toEqual({ day: 1, month: 1, year: 1990, yearVisible: true });
      expect(result.dateOfBirth).not.toHaveProperty('year_visible');
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getProfile('unknown-uuid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.getProfile('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('updateProfile', () => {
    it('returns existing profile unchanged when dto has no fields', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);

      const result = await service.updateProfile('user-uuid', {} as UpdateUserProfileDto);

      expect(result.firstName).toBe('John');
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('trims text fields and normalizes empty nullable fields to null', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      mockReturning.mockResolvedValue([{ ...mockProfileRow, bio: null }]);

      await service.updateProfile('user-uuid', { bio: '   ' });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ bio: null }));
    });

    it('stores dateOfBirth with year_visible key (not yearVisible)', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const updatedDob = { day: 20, month: 6, year: 1995, year_visible: false };
      mockReturning.mockResolvedValue([{ ...mockProfileRow, dateOfBirth: updatedDob }]);

      await service.updateProfile('user-uuid', {
        dateOfBirth: { day: 20, month: 6, year: 1995, yearVisible: false },
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOfBirth: { day: 20, month: 6, year: 1995, year_visible: false },
        }),
      );
    });

    it('updates all text fields and returns the mapped response', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const updated = {
        ...mockProfileRow,
        firstName: 'Jane',
        lastName: 'Smith',
        birthCity: 'Cali',
        homeCountry: 'US',
        homeCity: 'Miami',
        phoneCountryCode: '+1',
        phoneLocalNumber: '3055551234',
      };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateProfile('user-uuid', {
        firstName: 'Jane',
        lastName: 'Smith',
        birthCity: 'Cali',
        homeCountry: 'US',
        homeCity: 'Miami',
        phoneCountryCode: '+1',
        phoneLocalNumber: '3055551234',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.birthCity).toBe('Cali');
      expect(result.homeCountry).toBe('US');
      expect(result.homeCity).toBe('Miami');
      expect(result.phoneCountryCode).toBe('+1');
      expect(result.phoneLocalNumber).toBe('3055551234');
    });

    it('normalizes null birthCity and homeCity to null before saving', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      mockReturning.mockResolvedValue([{ ...mockProfileRow, birthCity: null, homeCity: null }]);

      await service.updateProfile('user-uuid', { birthCity: null, homeCity: null });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ birthCity: null, homeCity: null }),
      );
    });

    it('sets birthCountry to null', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockProfileRow, birthCountry: 'US' });
      mockReturning.mockResolvedValue([{ ...mockProfileRow, birthCountry: null }]);

      const result = await service.updateProfile('user-uuid', { birthCountry: null });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ birthCountry: null }));
      expect(result.birthCountry).toBeNull();
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.updateProfile('unknown-uuid', { firstName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when profile is deleted between check and update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      mockReturning.mockResolvedValue([]);

      await expect(service.updateProfile('user-uuid', { firstName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors on the initial fetch', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.updateProfile('user-uuid', { firstName: 'Jane' })).rejects.toThrow(
        dbError,
      );
    });

    it('propagates unexpected database errors on the update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(service.updateProfile('user-uuid', { firstName: 'Jane' })).rejects.toThrow(
        dbError,
      );
    });

    it('sets email and resets emailVerified to false when email changes', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockProfileRow,
        email: null,
        emailVerified: false,
      });
      mockReturning.mockResolvedValue([
        { ...mockProfileRow, email: 'new@example.com', emailVerified: false },
      ]);

      await service.updateProfile('user-uuid', { email: 'new@example.com' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', emailVerified: false }),
      );
    });

    it('does not reset emailVerified when email is unchanged', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockProfileRow,
        email: 'same@example.com',
        emailVerified: true,
      });
      mockReturning.mockResolvedValue([
        { ...mockProfileRow, email: 'same@example.com', emailVerified: true },
      ]);

      await service.updateProfile('user-uuid', { email: 'same@example.com' });

      expect(mockSet).toHaveBeenCalledWith(expect.not.objectContaining({ emailVerified: false }));
    });

    it('resets emailVerified when email is changed to a different address', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockProfileRow,
        email: 'old@example.com',
        emailVerified: true,
      });
      mockReturning.mockResolvedValue([
        { ...mockProfileRow, email: 'new@example.com', emailVerified: false },
      ]);

      await service.updateProfile('user-uuid', { email: 'new@example.com' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', emailVerified: false }),
      );
    });
  });
});
