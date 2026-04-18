import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoyaltyProgramDto, UpdateLoyaltyProgramDto } from './loyalty-program.dto';

const VALID_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const validProgram = {
  id: VALID_ID,
  programName: 'LifeMiles',
  memberId: 'ABC123456',
  notes: 'Gold tier, expires 2027-12',
};

describe('LoyaltyProgramDto', () => {
  it('accepts a valid program with notes', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, validProgram);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid program when notes is null', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, notes: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid program when notes is omitted', async () => {
    const { notes: _, ...withoutNotes } = validProgram;
    const dto = plainToInstance(LoyaltyProgramDto, withoutNotes);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID id', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, id: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('rejects an empty programName', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, programName: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'programName')).toBe(true);
  });

  it('rejects a programName exceeding 100 characters', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, {
      ...validProgram,
      programName: 'A'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'programName')).toBe(true);
  });

  it('trims programName before validating', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, programName: '  Miles  ' });
    expect(dto.programName).toBe('Miles');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects whitespace-only programName (trimmed to empty)', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, programName: '   ' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'programName')).toBe(true);
  });

  it('rejects an empty memberId', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, memberId: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'memberId')).toBe(true);
  });

  it('trims memberId before validating', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, memberId: '  ABC123  ' });
    expect(dto.memberId).toBe('ABC123');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('trims notes before validating when provided', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, { ...validProgram, notes: '  Gold  ' });
    expect(dto.notes).toBe('Gold');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes non-string values through the trim transform and rejects with IsString', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, {
      ...validProgram,
      programName: 42,
      memberId: [],
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'programName')).toBe(true);
    expect(errors.some((e) => e.property === 'memberId')).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const dto = plainToInstance(LoyaltyProgramDto, {});
    const errors = await validate(dto);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('id');
    expect(properties).toContain('programName');
    expect(properties).toContain('memberId');
  });
});

describe('UpdateLoyaltyProgramDto', () => {
  it('accepts an empty object (all fields optional)', async () => {
    const dto = plainToInstance(UpdateLoyaltyProgramDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with only programName', async () => {
    const dto = plainToInstance(UpdateLoyaltyProgramDto, { programName: 'Delta SkyMiles' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with only notes set to null', async () => {
    const dto = plainToInstance(UpdateLoyaltyProgramDto, { notes: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid programName when provided (empty string)', async () => {
    const dto = plainToInstance(UpdateLoyaltyProgramDto, { programName: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'programName')).toBe(true);
  });

  it('does not validate id field (OmitType removes its decorators)', async () => {
    // id is omitted — no @IsUUID() validator, so an invalid UUID passes without error
    const dto = plainToInstance(UpdateLoyaltyProgramDto, {
      id: 'not-a-uuid',
      programName: 'Miles',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
