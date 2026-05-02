import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EtaType, VisaEntries } from '@chamuco/shared-types';
import { CreateEtaDto, UpdateEtaDto } from './eta.dto';

const validBase = {
  destinationCountry: 'US',
  authorizationNumber: 'A1B2C3D4E5',
  etaType: EtaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-12-31',
};

describe('CreateEtaDto', () => {
  it('passes validation with all required fields', async () => {
    const dto = plainToInstance(CreateEtaDto, validBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes when notes is provided', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, notes: 'Max 90 days per stay' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes when notes is null', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, notes: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when destinationCountry is not a 2-letter uppercase code', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, destinationCountry: 'usa' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'destinationCountry')).toBe(true);
  });

  it('fails when authorizationNumber is empty', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, authorizationNumber: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'authorizationNumber')).toBe(true);
  });

  it('fails when etaType is invalid', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, etaType: 'WORK' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'etaType')).toBe(true);
  });

  it('fails when expiryDate is not a valid date string', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, expiryDate: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'expiryDate')).toBe(true);
  });

  it('fails when notes is an empty string', async () => {
    const dto = plainToInstance(CreateEtaDto, { ...validBase, notes: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});

describe('UpdateEtaDto', () => {
  it('passes with an empty body (all optional)', async () => {
    const dto = plainToInstance(UpdateEtaDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with a valid partial update', async () => {
    const dto = plainToInstance(UpdateEtaDto, {
      etaType: EtaType.TRANSIT,
      expiryDate: '2028-06-30',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when expiryDate is not a valid date string', async () => {
    const dto = plainToInstance(UpdateEtaDto, { expiryDate: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'expiryDate')).toBe(true);
  });

  it('fails when notes is an empty string', async () => {
    const dto = plainToInstance(UpdateEtaDto, { notes: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});
