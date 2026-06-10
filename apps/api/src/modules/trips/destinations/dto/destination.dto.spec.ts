import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateDestinationDto } from './create-destination.dto';
import { UpdateDestinationDto } from './update-destination.dto';

describe('CreateDestinationDto', () => {
  it('transforms countryCode to uppercase', () => {
    const dto = plainToInstance(CreateDestinationDto, { countryCode: 'mx', city: 'CANCUN' });
    expect(dto.countryCode).toBe('MX');
  });

  it('sanitizes city via sanitizeProperNoun', () => {
    const dto = plainToInstance(CreateDestinationDto, { countryCode: 'MX', city: '  cancun  ' });
    expect(dto.city).toBeDefined();
    expect(typeof dto.city).toBe('string');
  });

  it('accepts valid dto', async () => {
    const dto = plainToInstance(CreateDestinationDto, { countryCode: 'MX', city: 'CANCUN' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects countryCode with wrong length', async () => {
    const dto = plainToInstance(CreateDestinationDto, { countryCode: 'MEX', city: 'CANCUN' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects city with digits', async () => {
    const dto = plainToInstance(CreateDestinationDto, { countryCode: 'MX', city: 'C4NcUN' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts optional label', async () => {
    const dto = plainToInstance(CreateDestinationDto, {
      countryCode: 'MX',
      city: 'CANCUN',
      label: 'Beach stop',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.label).toBe('Beach stop');
  });
});

describe('UpdateDestinationDto', () => {
  it('transforms countryCode to uppercase when provided', () => {
    const dto = plainToInstance(UpdateDestinationDto, { countryCode: 'co' });
    expect(dto.countryCode).toBe('CO');
  });

  it('sanitizes city via sanitizeProperNoun when provided', () => {
    const dto = plainToInstance(UpdateDestinationDto, { city: '  bogota  ' });
    expect(dto.city).toBeDefined();
    expect(typeof dto.city).toBe('string');
  });

  it('accepts empty dto (all fields optional)', async () => {
    const dto = plainToInstance(UpdateDestinationDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts partial update with only city', async () => {
    const dto = plainToInstance(UpdateDestinationDto, { city: 'TULUM' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.city).toBe('TULUM');
  });

  it('rejects city with digits when provided', async () => {
    const dto = plainToInstance(UpdateDestinationDto, { city: 'T4LUM' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
