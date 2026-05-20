import { getTableConfig } from 'drizzle-orm/pg-core';

import { NotificationType } from '@chamuco/shared-types';

import { notificationTypeEnum, notifications } from './notifications.schema';

describe('notifications schema', () => {
  it('exports the notifications table', () => {
    expect(notifications).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(notifications);
    expect(config.name).toBe('notifications');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(notifications);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
        'created_at',
      ]),
    );
  });

  it('has a FK from user_id to users.id with ON DELETE CASCADE', () => {
    const config = getTableConfig(notifications);
    expect(config.foreignKeys).toHaveLength(1);
    const fk = config.foreignKeys[0]!;
    expect(fk.reference().columns[0]?.name).toBe('user_id');
    expect(fk.reference().foreignColumns[0]?.name).toBe('id');
    expect(fk.onDelete).toBe('cascade');
  });

  it('has index on (user_id, created_at)', () => {
    const config = getTableConfig(notifications);
    const index = config.indexes.find(
      (i) => i.config.name === 'idx_notifications_user_id_created_at',
    );
    expect(index).toBeDefined();
    const indexColumnNames = index!.config.columns.map((c) => ('name' in c ? c.name : ''));
    expect(indexColumnNames).toContain('user_id');
    expect(indexColumnNames).toContain('created_at');
  });

  it('has nullable data and read_at columns', () => {
    const config = getTableConfig(notifications);
    const data = config.columns.find((c) => c.name === 'data');
    const readAt = config.columns.find((c) => c.name === 'read_at');
    expect(data?.notNull).toBe(false);
    expect(readAt?.notNull).toBe(false);
  });

  it('notificationTypeEnum contains all NotificationType values', () => {
    const values = Object.values(NotificationType);
    values.forEach((v) => {
      expect(notificationTypeEnum.enumValues).toContain(v);
    });
  });

  it('notificationTypeEnum has exactly 10 values', () => {
    expect(notificationTypeEnum.enumValues).toHaveLength(10);
  });
});
