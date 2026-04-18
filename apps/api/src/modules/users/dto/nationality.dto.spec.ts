import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateNationalityDto, UpdateNationalityDto } from './nationality.dto';

const validBase = {
  countryCode: 'CO',
  isPrimary: true,
};

const validPassport = {
  passportNumber: 'AB123456',
  passportIssueDate: '2020-01-15',
  passportExpiryDate: '2030-01-15',
};

describe('CreateNationalityDto', () => {
  it('accepts a valid nationality without passport data', async () => {
    const dto = plainToInstance(CreateNationalityDto, validBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid nationality with full passport data', async () => {
    const dto = plainToInstance(CreateNationalityDto, { ...validBase, ...validPassport });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts nationalIdNumber when provided', async () => {
    const dto = plainToInstance(CreateNationalityDto, {
      ...validBase,
      nationalIdNumber: '12345678',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects nationalIdNumber as empty string', async () => {
    const dto = plainToInstance(CreateNationalityDto, { ...validBase, nationalIdNumber: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nationalIdNumber')).toBe(true);
  });

  it('rejects countryCode with more than 2 letters', async () => {
    const dto = plainToInstance(CreateNationalityDto, { ...validBase, countryCode: 'COL' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'countryCode')).toBe(true);
  });

  it('rejects countryCode with fewer than 2 letters', async () => {
    const dto = plainToInstance(CreateNationalityDto, { ...validBase, countryCode: 'C' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'countryCode')).toBe(true);
  });

  it('rejects countryCode with lowercase letters', async () => {
    const dto = plainToInstance(CreateNationalityDto, { ...validBase, countryCode: 'co' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'countryCode')).toBe(true);
  });

  it('rejects missing isPrimary', async () => {
    const dto = plainToInstance(CreateNationalityDto, { countryCode: 'CO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'isPrimary')).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const dto = plainToInstance(CreateNationalityDto, {});
    const errors = await validate(dto);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('countryCode');
    expect(properties).toContain('isPrimary');
  });

  describe('passport data consistency', () => {
    it('requires passportIssueDate and passportExpiryDate when only passportNumber is provided', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        passportNumber: 'AB123456',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportIssueDate')).toBe(true);
      expect(errors.some((e) => e.property === 'passportExpiryDate')).toBe(true);
    });

    it('requires passportNumber and passportExpiryDate when only passportIssueDate is provided', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        passportIssueDate: '2020-01-15',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportNumber')).toBe(true);
      expect(errors.some((e) => e.property === 'passportExpiryDate')).toBe(true);
    });

    it('requires passportNumber and passportIssueDate when only passportExpiryDate is provided', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        passportExpiryDate: '2030-01-15',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportNumber')).toBe(true);
      expect(errors.some((e) => e.property === 'passportIssueDate')).toBe(true);
    });

    it('rejects two of three passport fields provided', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportExpiryDate')).toBe(true);
    });

    it('rejects passportIssueDate in non-ISO format', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        ...validPassport,
        passportIssueDate: '15/01/2020',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportIssueDate')).toBe(true);
    });

    it('rejects passportExpiryDate in non-ISO format', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        ...validPassport,
        passportExpiryDate: 'January 15 2030',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportExpiryDate')).toBe(true);
    });

    it('rejects passportNumber as empty string', async () => {
      const dto = plainToInstance(CreateNationalityDto, {
        ...validBase,
        ...validPassport,
        passportNumber: '',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportNumber')).toBe(true);
    });
  });
});

describe('UpdateNationalityDto', () => {
  it('accepts an empty object (all fields optional)', async () => {
    const dto = plainToInstance(UpdateNationalityDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with only isPrimary', async () => {
    const dto = plainToInstance(UpdateNationalityDto, { isPrimary: true });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update with only nationalIdNumber', async () => {
    const dto = plainToInstance(UpdateNationalityDto, { nationalIdNumber: '99887766' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a full passport data update', async () => {
    const dto = plainToInstance(UpdateNationalityDto, validPassport);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects non-boolean isPrimary', async () => {
    const dto = plainToInstance(UpdateNationalityDto, { isPrimary: 'yes' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'isPrimary')).toBe(true);
  });

  it('rejects nationalIdNumber as empty string', async () => {
    const dto = plainToInstance(UpdateNationalityDto, { nationalIdNumber: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nationalIdNumber')).toBe(true);
  });

  describe('passport data consistency', () => {
    it('requires all three passport fields when only one is provided', async () => {
      const dto = plainToInstance(UpdateNationalityDto, { passportNumber: 'AB123456' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'passportIssueDate')).toBe(true);
      expect(errors.some((e) => e.property === 'passportExpiryDate')).toBe(true);
    });

    it('accepts all three passport fields provided', async () => {
      const dto = plainToInstance(UpdateNationalityDto, validPassport);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts when no passport fields are provided', async () => {
      const dto = plainToInstance(UpdateNationalityDto, { isPrimary: false });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
