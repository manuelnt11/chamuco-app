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

    it('trims firstName before validating', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { firstName: '  John  ' });
      expect(dto.firstName).toBe('John');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts a valid E.164 phoneNumber', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneNumber: '+573001234567' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects phoneNumber without leading +', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneNumber: '573001234567' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'phoneNumber')).toBe(true);
    });

    it('rejects phoneNumber with invalid E.164 format', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, { phoneNumber: '+0123456' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'phoneNumber')).toBe(true);
    });

    it('passes non-string values through the trim transform and rejects with IsString', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        firstName: 42,
        lastName: true,
        phoneNumber: [],
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
      expect(errors.some((e) => e.property === 'lastName')).toBe(true);
      expect(errors.some((e) => e.property === 'phoneNumber')).toBe(true);
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
