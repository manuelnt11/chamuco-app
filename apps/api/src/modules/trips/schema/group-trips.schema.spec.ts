import { getTableConfig } from 'drizzle-orm/pg-core';

import { groupTrips } from './group-trips.schema';

describe('group_trips schema', () => {
  it('has composite PK on (trip_id, group_id)', () => {
    const config = getTableConfig(groupTrips);
    expect(config.primaryKeys).toHaveLength(1);
    const pk = config.primaryKeys[0];
    if (!pk) throw new Error('Expected composite PK to exist');
    const pkColumns = pk.columns.map((c) => c.name);
    expect(pkColumns).toEqual(expect.arrayContaining(['trip_id', 'group_id']));
  });

  it('has index on group_id', () => {
    const config = getTableConfig(groupTrips);
    const indexNames = config.indexes.map((i) => i.config.name);
    expect(indexNames).toContain('idx_group_trips_group_id');
  });

  it('added_at is timestamptz', () => {
    const config = getTableConfig(groupTrips);
    const col = config.columns.find((c) => c.name === 'added_at');
    expect(col?.getSQLType()).toBe('timestamp with time zone');
  });
});
