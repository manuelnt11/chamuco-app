import { getTableConfig } from 'drizzle-orm/pg-core';

import { userVisas } from './user-visas.schema';

describe('userVisas schema', () => {
  it('exports the userVisas table', () => {
    expect(userVisas).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(userVisas);
    expect(config.name).toBe('user_visas');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(userVisas);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'nationality_id',
        'coverage_type',
        'country_code',
        'visa_zone',
        'visa_type',
        'entries',
        'expiry_date',
        'visa_status',
        'notes',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('has nationality_id as not null', () => {
    const config = getTableConfig(userVisas);
    const col = config.columns.find((c) => c.name === 'nationality_id');
    expect(col?.notNull).toBe(true);
  });

  it('has country_code and visa_zone as nullable', () => {
    const config = getTableConfig(userVisas);
    const countryCode = config.columns.find((c) => c.name === 'country_code');
    const visaZone = config.columns.find((c) => c.name === 'visa_zone');
    expect(countryCode?.notNull).toBe(false);
    expect(visaZone?.notNull).toBe(false);
  });

  it('has notes as nullable', () => {
    const config = getTableConfig(userVisas);
    const notes = config.columns.find((c) => c.name === 'notes');
    expect(notes?.notNull).toBe(false);
  });

  it('has expiry_date, coverage_type, visa_type, entries, visa_status as not null', () => {
    const config = getTableConfig(userVisas);
    const required = ['expiry_date', 'coverage_type', 'visa_type', 'entries', 'visa_status'];
    for (const name of required) {
      const col = config.columns.find((c) => c.name === name);
      expect(col?.notNull).toBe(true);
    }
  });

  it('has FK from nationality_id to user_nationalities.id with CASCADE on delete', () => {
    const config = getTableConfig(userVisas);
    const fk = config.foreignKeys.find((f) => f.reference().columns[0]?.name === 'nationality_id');
    expect(fk).toBeDefined();
    expect(fk?.reference().foreignColumns[0]?.name).toBe('id');
    expect(fk?.onDelete).toBe('cascade');
  });

  it('has indexes on nationality_id and visa_status', () => {
    const config = getTableConfig(userVisas);
    const indexNames = config.indexes.map((i) => i.config.name);
    expect(indexNames).toContain('user_visas_nationality_id_idx');
    expect(indexNames).toContain('user_visas_visa_status_idx');
  });

  it('has visa_coverage_consistency check constraint', () => {
    const config = getTableConfig(userVisas);
    const checkNames = config.checks.map((c) => c.name);
    expect(checkNames).toContain('visa_coverage_consistency');
  });
});
