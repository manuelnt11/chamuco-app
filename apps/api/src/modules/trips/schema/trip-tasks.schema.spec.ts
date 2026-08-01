import { getTableConfig } from 'drizzle-orm/pg-core';

import { tripTaskCompletions, tripTasks } from './trip-tasks.schema';

describe('trip_tasks schema', () => {
  it('has UUID primary key', () => {
    const config = getTableConfig(tripTasks);
    expect(config.primaryKeys).toHaveLength(0);
    expect(config.columns.find((c) => c.name === 'id')?.primary).toBe(true);
  });

  it('has index on (trip_id, owner_id)', () => {
    const config = getTableConfig(tripTasks);
    const indexNames = config.indexes.map((i) => i.config.name);
    expect(indexNames).toContain('idx_trip_tasks_trip_id_owner_id');
  });

  it('has CHECK constraint for trip_tasks_completed_only_when_personal', () => {
    const config = getTableConfig(tripTasks);
    const checkNames = config.checks.map((c) => c.name);
    expect(checkNames).toContain('trip_tasks_completed_only_when_personal');
  });

  it('has timestamptz columns for completed_at and created_at', () => {
    const config = getTableConfig(tripTasks);
    const tsColumns = config.columns.filter((c) => ['completed_at', 'created_at'].includes(c.name));
    expect(tsColumns).toHaveLength(2);
    tsColumns.forEach((col) => expect(col.getSQLType()).toBe('timestamp with time zone'));
  });

  it('owner_id is nullable (null denotes a shared task)', () => {
    const config = getTableConfig(tripTasks);
    const ownerId = config.columns.find((c) => c.name === 'owner_id');
    expect(ownerId?.notNull).toBe(false);
  });
});

describe('trip_task_completions schema', () => {
  it('has composite primary key on (task_id, user_id)', () => {
    const config = getTableConfig(tripTaskCompletions);
    expect(config.primaryKeys).toHaveLength(1);
    const pkColumnNames = config.primaryKeys[0]!.columns.map((c) => c.name);
    expect(pkColumnNames).toContain('task_id');
    expect(pkColumnNames).toContain('user_id');
  });

  it('has timestamptz column for completed_at', () => {
    const config = getTableConfig(tripTaskCompletions);
    const completedAt = config.columns.find((c) => c.name === 'completed_at');
    expect(completedAt?.getSQLType()).toBe('timestamp with time zone');
    expect(completedAt?.notNull).toBe(true);
  });
});
