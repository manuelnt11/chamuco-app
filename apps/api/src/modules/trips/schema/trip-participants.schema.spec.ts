import { getTableConfig } from 'drizzle-orm/pg-core';

import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';

import {
  tripParticipants,
  tripParticipantsRelations,
  tripParticipantStatusEnum,
  tripRoleEnum,
} from './trip-participants.schema';

describe('trip_participants schema', () => {
  it('exports the tripParticipants table', () => {
    expect(tripParticipants).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(tripParticipants);
    expect(config.name).toBe('trip_participants');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(tripParticipants);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'trip_id',
        'user_id',
        'role',
        'status',
        'is_traveler',
        'did_travel',
        'initiated_at',
        'confirmed_at',
        'updated_at',
        'initiated_by',
        'decided_by',
      ]),
    );
  });

  it('has composite primary key on (trip_id, user_id)', () => {
    const config = getTableConfig(tripParticipants);
    expect(config.primaryKeys).toHaveLength(1);
    const pkColumnNames = config.primaryKeys[0]!.columns.map((c) => c.name);
    expect(pkColumnNames).toContain('trip_id');
    expect(pkColumnNames).toContain('user_id');
  });

  it('has CHECK constraint for participant_must_be_traveler', () => {
    const config = getTableConfig(tripParticipants);
    const checkNames = config.checks.map((c) => c.name);
    expect(checkNames).toContain('participant_must_be_traveler');
  });

  it('has indexes on (user_id, status) and (trip_id, status)', () => {
    const config = getTableConfig(tripParticipants);
    const indexNames = config.indexes.map((i) => i.config.name);
    expect(indexNames).toContain('idx_trip_participants_user_id_status');
    expect(indexNames).toContain('idx_trip_participants_trip_id_status');
  });

  it('has timestamptz columns for initiated_at, confirmed_at, and updated_at', () => {
    const config = getTableConfig(tripParticipants);
    const tsColumns = config.columns.filter((c) =>
      ['initiated_at', 'confirmed_at', 'updated_at'].includes(c.name),
    );
    expect(tsColumns).toHaveLength(3);
    tsColumns.forEach((col) => expect(col.getSQLType()).toBe('timestamp with time zone'));
  });

  it('tripRoleEnum contains all TripRole values', () => {
    expect(tripRoleEnum.enumValues).toContain(TripRole.ORGANIZER);
    expect(tripRoleEnum.enumValues).toContain(TripRole.CO_ORGANIZER);
    expect(tripRoleEnum.enumValues).toContain(TripRole.PARTICIPANT);
  });

  it('tripParticipantStatusEnum contains all TripParticipantStatus values', () => {
    expect(tripParticipantStatusEnum.enumValues).toContain(TripParticipantStatus.INVITED);
    expect(tripParticipantStatusEnum.enumValues).toContain(TripParticipantStatus.PENDING_REQUEST);
    expect(tripParticipantStatusEnum.enumValues).toContain(TripParticipantStatus.ACCEPTED);
    expect(tripParticipantStatusEnum.enumValues).toContain(TripParticipantStatus.CONFIRMED);
    expect(tripParticipantStatusEnum.enumValues).toContain(TripParticipantStatus.DECLINED);
  });

  it('exports tripParticipantsRelations', () => {
    expect(tripParticipantsRelations).toBeDefined();
  });
});
