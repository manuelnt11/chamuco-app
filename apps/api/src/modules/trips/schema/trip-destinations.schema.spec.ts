import { getTableConfig } from 'drizzle-orm/pg-core';

import { tripDestinations, tripDestinationsRelations } from './trip-destinations.schema';

describe('trip_destinations schema', () => {
  it('exports the tripDestinations table', () => {
    expect(tripDestinations).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(tripDestinations);
    expect(config.name).toBe('trip_destinations');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(tripDestinations);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'trip_id',
        'position',
        'country_code',
        'city',
        'label',
        'created_at',
      ]),
    );
  });

  it('has UNIQUE constraint on (trip_id, position)', () => {
    const config = getTableConfig(tripDestinations);
    const uniqueNames = config.uniqueConstraints.map((u) => u.name);
    expect(uniqueNames).toContain('trip_destinations_trip_id_position_unique');
  });

  it('has CHECK constraint for position minimum', () => {
    const config = getTableConfig(tripDestinations);
    const checkNames = config.checks.map((c) => c.name);
    expect(checkNames).toContain('trip_destinations_position_min');
  });

  it('created_at is timestamptz', () => {
    const config = getTableConfig(tripDestinations);
    const col = config.columns.find((c) => c.name === 'created_at');
    expect(col?.getSQLType()).toBe('timestamp with time zone');
  });

  it('exports tripDestinationsRelations', () => {
    expect(tripDestinationsRelations).toBeDefined();
  });
});
