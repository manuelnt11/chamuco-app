import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { VisaCoverageType, VisaEntries, VisaType, VisaZone } from '@chamuco/shared-types';
import { CreateVisaDto, UpdateVisaDto } from './visa.dto';

const validCountryBase = {
  coverageType: VisaCoverageType.COUNTRY,
  countryCode: 'US',
  visaType: VisaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-12-31',
};

const validZoneBase = {
  coverageType: VisaCoverageType.ZONE,
  visaZone: VisaZone.SCHENGEN,
  visaType: VisaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-12-31',
};

describe('CreateVisaDto', () => {
  it('passes validation for COUNTRY coverage', async () => {
    const dto = plainToInstance(CreateVisaDto, validCountryBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes validation for ZONE coverage', async () => {
    const dto = plainToInstance(CreateVisaDto, validZoneBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when coverageType is COUNTRY but countryCode is missing', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validCountryBase, countryCode: undefined });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'countryCode')).toBe(true);
  });

  it('fails when coverageType is ZONE but visaZone is missing', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validZoneBase, visaZone: undefined });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'visaZone')).toBe(true);
  });

  it('fails when countryCode is not a 2-letter uppercase code', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validCountryBase, countryCode: 'usa' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'countryCode')).toBe(true);
  });

  it('fails when expiryDate is not a valid date string', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validCountryBase, expiryDate: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'expiryDate')).toBe(true);
  });

  it('fails when notes is an empty string', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validCountryBase, notes: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });

  it('passes when notes is null', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validCountryBase, notes: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when visaType is invalid', async () => {
    const dto = plainToInstance(CreateVisaDto, { ...validCountryBase, visaType: 'INVALID' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'visaType')).toBe(true);
  });
});

describe('UpdateVisaDto', () => {
  it('passes with an empty body (all optional)', async () => {
    const dto = plainToInstance(UpdateVisaDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with a valid partial update', async () => {
    const dto = plainToInstance(UpdateVisaDto, {
      visaType: VisaType.BUSINESS,
      expiryDate: '2028-06-30',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when expiryDate is not a valid date string', async () => {
    const dto = plainToInstance(UpdateVisaDto, { expiryDate: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'expiryDate')).toBe(true);
  });
});
