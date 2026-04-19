import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from './register.dto';

const validBase = {
  username: 'john_doe',
  displayName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 15, month: 6, year: 2000, yearVisible: false },
  homeCountry: 'CO',
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  nationalities: [{ countryCode: 'CO', isPrimary: true }],
  emergencyContacts: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: true,
    },
  ],
};

describe('RegisterDto', () => {
  describe('@Transform — username normalisation', () => {
    it('lowercases an uppercase username before validation', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, username: 'JOHN_DOE' });
      expect(dto.username).toBe('john_doe');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('leaves an already-lowercase username unchanged', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, username: 'jane_doe' });
      expect(dto.username).toBe('jane_doe');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes non-string values through unchanged (defensive branch)', async () => {
      const dto = plainToInstance(RegisterDto, { username: 123 });
      expect(dto.username).toBe(123);
    });
  });

  describe('@Transform — displayName trimming', () => {
    it('trims whitespace from a displayName string', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, displayName: '  John Doe  ' });
      expect(dto.displayName).toBe('John Doe');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes non-string displayName values through unchanged (defensive branch)', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'john_doe', displayName: 42 });
      expect(dto.displayName).toBe(42);
    });
  });

  describe('@Matches validation', () => {
    it('rejects a username that contains invalid characters', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'invalid username!' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a username shorter than 3 characters', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'ab' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('new required fields', () => {
    it('rejects when firstName is missing', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, firstName: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('rejects when homeCountry is not a 2-letter uppercase code', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, homeCountry: 'colombia' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'homeCountry')).toBe(true);
    });

    it('rejects when nationalities array is empty', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, nationalities: [] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'nationalities')).toBe(true);
    });

    it('rejects when emergencyContacts array is empty', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, emergencyContacts: [] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'emergencyContacts')).toBe(true);
    });

    it('accepts optional homeCity when provided', async () => {
      const dto = plainToInstance(RegisterDto, { ...validBase, homeCity: 'Medellín' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts valid payload without homeCity', async () => {
      const dto = plainToInstance(RegisterDto, validBase);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
