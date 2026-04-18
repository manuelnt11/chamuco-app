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
