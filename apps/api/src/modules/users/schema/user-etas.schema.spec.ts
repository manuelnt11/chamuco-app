import { getTableConfig } from 'drizzle-orm/pg-core';

import { userEtas } from './user-etas.schema';

describe('userEtas schema', () => {
  it('exports the userEtas table', () => {
    expect(userEtas).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(userEtas);
    expect(config.name).toBe('user_etas');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(userEtas);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'user_nationality_id',
        'passport_number',
        'destination_country',
        'authorization_number',
        'eta_type',
        'entries',
        'expiry_date',
        'eta_status',
        'notes',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('has required columns as not null', () => {
    const config = getTableConfig(userEtas);
    const required = [
      'user_nationality_id',
      'passport_number',
      'destination_country',
      'authorization_number',
      'eta_type',
      'entries',
      'expiry_date',
      'eta_status',
    ];
    for (const name of required) {
      const col = config.columns.find((c) => c.name === name);
      expect(col?.notNull).toBe(true);
    }
  });

  it('has notes as nullable', () => {
    const config = getTableConfig(userEtas);
    const notes = config.columns.find((c) => c.name === 'notes');
    expect(notes?.notNull).toBe(false);
  });

  it('has FK from user_nationality_id to user_nationalities.id with CASCADE on delete', () => {
    const config = getTableConfig(userEtas);
    const fk = config.foreignKeys.find(
      (f) => f.reference().columns[0]?.name === 'user_nationality_id',
    );
    expect(fk).toBeDefined();
    expect(fk?.reference().foreignColumns[0]?.name).toBe('id');
    expect(fk?.onDelete).toBe('cascade');
  });

  it('has indexes on user_nationality_id, eta_status, and passport_number', () => {
    const config = getTableConfig(userEtas);
    const indexNames = config.indexes.map((i) => i.config.name);
    expect(indexNames).toContain('user_etas_user_nationality_id_idx');
    expect(indexNames).toContain('user_etas_eta_status_idx');
    expect(indexNames).toContain('user_etas_passport_number_idx');
  });
});
