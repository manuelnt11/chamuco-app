import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserProfileDto } from './update-user-profile.dto';

describe('UpdateUserProfileDto', () => {
  describe('dateOfBirth nested validation', () => {
    it('accepts a valid dateOfBirth object', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        dateOfBirth: { day: 15, month: 6, year: 1990, yearVisible: true },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.dateOfBirth?.day).toBe(15);
      expect(dto.dateOfBirth?.yearVisible).toBe(true);
    });

    it('rejects dateOfBirth with out-of-range day', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        dateOfBirth: { day: 32, month: 6, year: 1990, yearVisible: true },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.children?.[0]?.property).toBe('day');
    });

    it('rejects dateOfBirth with invalid month', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        dateOfBirth: { day: 15, month: 13, year: 1990, yearVisible: true },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.children?.[0]?.property).toBe('month');
    });
  });

  describe('firstName / lastName / phoneNumber validation', () => {
    it('accepts valid firstName and lastName', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { firstName: 'Ana', lastName: 'Pérez' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects firstName shorter than 2 characters', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { firstName: 'A' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('rejects whitespace-only firstName (trimmed to empty before validating)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { firstName: '   ' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('trims and uppercases firstName before validating', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { firstName: '  John  ' });
      expect(dto.firstName).toBe('JOHN');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts valid phoneCountryCode and phoneLocalNumber', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        phoneCountryCode: '+57',
        phoneLocalNumber: '3001234567',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts single-digit country code (+1)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        phoneCountryCode: '+1',
        phoneLocalNumber: '3055551234',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects phoneCountryCode without leading +', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneCountryCode: '57' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
    });

    it('rejects phoneCountryCode starting with +0', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneCountryCode: '+0' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
    });

    it('rejects phoneLocalNumber with letters or symbols', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneLocalNumber: '300-123-4567' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
    });

    it('rejects phoneLocalNumber shorter than 4 digits', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneLocalNumber: '123' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
    });

    it('passes non-string values through the trim transform and rejects with IsString', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        firstName: 42,
        lastName: true,
        phoneCountryCode: [],
        phoneLocalNumber: {},
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
      expect(errors.some((e) => e.property === 'lastName')).toBe(true);
      expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
      expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
    });
  });

  describe('city field validation (birthCity / homeCity)', () => {
    it('accepts valid city names with accents', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthCity: 'bogotá',
        homeCity: 'medellín',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.birthCity).toBe('BOGOTÁ');
      expect(dto.homeCity).toBe('MEDELLÍN');
    });

    it('collapses repeated spaces in city names', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { homeCity: '  SAN   JOSE  ' });
      expect(dto.homeCity).toBe('SAN JOSE');
    });

    it('rejects city names with digits', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { birthCity: 'CIUDAD123' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'birthCity')).toBe(true);
    });

    it('rejects city names with symbols', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { homeCity: 'SAN-JOSE' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'homeCity')).toBe(true);
    });

    it('accepts single-character city name (e.g. Norwegian city "Å")', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { homeCity: 'Å' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.homeCity).toBe('Å');
    });

    it('accepts null to clear city fields', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { birthCity: null, homeCity: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('country code validation', () => {
    it('accepts valid ISO 3166-1 alpha-2 country codes', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        birthCountry: 'CO',
        homeCountry: 'US',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects lowercase country codes', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { homeCountry: 'co' });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'homeCountry')).toBe(true);
    });

    it('rejects country codes longer than 2 characters', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { birthCountry: 'COL' });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'birthCountry')).toBe(true);
    });
  });
});
