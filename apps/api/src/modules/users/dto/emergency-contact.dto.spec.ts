import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EmergencyContactDto, UpdateEmergencyContactDto } from './emergency-contact.dto';

const VALID_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const validContact = {
  id: VALID_ID,
  fullName: 'María López',
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  relationship: 'mother',
  isPrimary: true,
};

describe('EmergencyContactDto', () => {
  it('accepts a valid contact', async () => {
    const dto = plainToInstance(EmergencyContactDto, validContact);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID id', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, id: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('rejects fullName shorter than 2 characters', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, fullName: 'A' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fullName')).toBe(true);
  });

  it('rejects whitespace-only fullName (trimmed to empty before validating)', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, fullName: '   ' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fullName')).toBe(true);
  });

  it('trims fullName before validating', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, fullName: '  Ana  ' });
    expect(dto.fullName).toBe('Ana');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts single-digit country code (+1)', async () => {
    const dto = plainToInstance(EmergencyContactDto, {
      ...validContact,
      phoneCountryCode: '+1',
      phoneLocalNumber: '3055551234',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects phoneCountryCode without leading +', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, phoneCountryCode: '57' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
  });

  it('rejects phoneCountryCode starting with +0', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, phoneCountryCode: '+0' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
  });

  it('rejects phoneLocalNumber with letters or symbols', async () => {
    const dto = plainToInstance(EmergencyContactDto, {
      ...validContact,
      phoneLocalNumber: '300-123-4567',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
  });

  it('rejects phoneLocalNumber shorter than 4 digits', async () => {
    const dto = plainToInstance(EmergencyContactDto, { ...validContact, phoneLocalNumber: '123' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
  });

  it('passes non-string values through the trim transform and rejects with IsString', async () => {
    const dto = plainToInstance(EmergencyContactDto, {
      ...validContact,
      fullName: 42,
      phoneCountryCode: [],
      phoneLocalNumber: {},
      relationship: true,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fullName')).toBe(true);
    expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
    expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
    expect(errors.some((e) => e.property === 'relationship')).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const dto = plainToInstance(EmergencyContactDto, {});
    const errors = await validate(dto);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('id');
    expect(properties).toContain('fullName');
    expect(properties).toContain('phoneCountryCode');
    expect(properties).toContain('phoneLocalNumber');
    expect(properties).toContain('relationship');
    expect(properties).toContain('isPrimary');
  });
});

describe('UpdateEmergencyContactDto', () => {
  it('accepts an empty object (all fields optional)', async () => {
    const dto = plainToInstance(UpdateEmergencyContactDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with only isPrimary', async () => {
    const dto = plainToInstance(UpdateEmergencyContactDto, { isPrimary: false });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with all optional string fields and trims them', async () => {
    const dto = plainToInstance(UpdateEmergencyContactDto, {
      fullName: '  Ana López  ',
      phoneCountryCode: '+1',
      phoneLocalNumber: '3055551234',
      relationship: '  sister  ',
    });
    expect(dto.fullName).toBe('Ana López');
    expect(dto.relationship).toBe('sister');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid phoneCountryCode when provided', async () => {
    const dto = plainToInstance(UpdateEmergencyContactDto, { phoneCountryCode: '57' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
  });

  it('passes non-string values through the trim transform and rejects with IsString', async () => {
    const dto = plainToInstance(UpdateEmergencyContactDto, {
      fullName: 42,
      phoneCountryCode: [],
      phoneLocalNumber: {},
      relationship: true,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fullName')).toBe(true);
    expect(errors.some((e) => e.property === 'phoneCountryCode')).toBe(true);
    expect(errors.some((e) => e.property === 'phoneLocalNumber')).toBe(true);
    expect(errors.some((e) => e.property === 'relationship')).toBe(true);
  });
});
