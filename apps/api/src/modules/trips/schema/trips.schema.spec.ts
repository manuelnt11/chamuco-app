import { getTableConfig } from 'drizzle-orm/pg-core';

import { TripStatus, TripVisibility } from '@chamuco/shared-types';

import { tripStatusEnum, trips, tripsRelations, tripVisibilityEnum } from './trips.schema';

describe('trips schema', () => {
  it('exports the trips table', () => {
    expect(trips).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(trips);
    expect(config.name).toBe('trips');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(trips);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'description',
        'cover',
        'status',
        'visibility',
        'start_date',
        'end_date',
        'default_timezone',
        'default_currency',
        'participant_capacity',
        'departure_country',
        'departure_city',
        'landing_country',
        'landing_city',
        'itinerary_notes',
        'agency_id',
        'created_by',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('has CHECK constraints for date order and capacity minimum', () => {
    const config = getTableConfig(trips);
    expect(config.checks).toHaveLength(2);
    const checkNames = config.checks.map((c) => c.name);
    expect(checkNames).toContain('trips_date_order');
    expect(checkNames).toContain('trips_participant_capacity_min');
  });

  it('has timestamptz columns for created_at and updated_at', () => {
    const config = getTableConfig(trips);
    const tsColumns = config.columns.filter((c) => ['created_at', 'updated_at'].includes(c.name));
    expect(tsColumns).toHaveLength(2);
    tsColumns.forEach((col) => expect(col.getSQLType()).toBe('timestamp with time zone'));
  });

  it('tripStatusEnum contains all TripStatus values', () => {
    expect(tripStatusEnum.enumValues).toContain(TripStatus.DRAFT);
    expect(tripStatusEnum.enumValues).toContain(TripStatus.OPEN);
    expect(tripStatusEnum.enumValues).toContain(TripStatus.CONFIRMED);
    expect(tripStatusEnum.enumValues).toContain(TripStatus.IN_PROGRESS);
    expect(tripStatusEnum.enumValues).toContain(TripStatus.COMPLETED);
    expect(tripStatusEnum.enumValues).toContain(TripStatus.CANCELLED);
  });

  it('tripVisibilityEnum contains all TripVisibility values', () => {
    expect(tripVisibilityEnum.enumValues).toContain(TripVisibility.PUBLIC);
    expect(tripVisibilityEnum.enumValues).toContain(TripVisibility.PRIVATE);
  });

  it('exports tripsRelations', () => {
    expect(tripsRelations).toBeDefined();
  });
});
