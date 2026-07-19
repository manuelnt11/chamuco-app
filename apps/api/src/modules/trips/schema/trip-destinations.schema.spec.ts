import { getTableConfig } from 'drizzle-orm/pg-core';

import { tripDestinations } from './trip-destinations.schema';

describe('trip_destinations schema', () => {
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
});
