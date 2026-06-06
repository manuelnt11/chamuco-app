import { getTableConfig } from 'drizzle-orm/pg-core';

import { groupTrips, groupTripsRelations } from './group-trips.schema';

describe('group_trips schema', () => {
  it('exports the groupTrips table', () => {
    expect(groupTrips).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(groupTrips);
    expect(config.name).toBe('group_trips');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(groupTrips);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(expect.arrayContaining(['trip_id', 'group_id', 'added_at']));
  });

  it('has composite PK on (trip_id, group_id)', () => {
    const config = getTableConfig(groupTrips);
    expect(config.primaryKeys).toHaveLength(1);
    const pk = config.primaryKeys[0];
    expect(pk).toBeDefined();
    const pkColumns = pk!.columns.map((c) => c.name);
    expect(pkColumns).toEqual(expect.arrayContaining(['trip_id', 'group_id']));
  });

  it('added_at is timestamptz', () => {
    const config = getTableConfig(groupTrips);
    const col = config.columns.find((c) => c.name === 'added_at');
    expect(col?.getSQLType()).toBe('timestamp with time zone');
  });

  it('exports groupTripsRelations', () => {
    expect(groupTripsRelations).toBeDefined();
  });
});
