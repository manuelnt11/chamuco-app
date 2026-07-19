import { getTableConfig } from 'drizzle-orm/pg-core';

import { DeliveryStatus, NotificationChannel } from '@chamuco/shared-types';

import {
  deliveryStatusEnum,
  notificationChannelEnum,
  notificationDeliveries,
} from './notification-deliveries.schema';

describe('notification-deliveries schema', () => {
  it('has a FK from notification_id to notifications.id with ON DELETE CASCADE', () => {
    const config = getTableConfig(notificationDeliveries);
    expect(config.foreignKeys).toHaveLength(1);
    const fk = config.foreignKeys[0]!;
    expect(fk.reference().columns[0]?.name).toBe('notification_id');
    expect(fk.reference().foreignColumns[0]?.name).toBe('id');
    expect(fk.onDelete).toBe('cascade');
  });

  it('status column defaults to PENDING', () => {
    const config = getTableConfig(notificationDeliveries);
    const status = config.columns.find((c) => c.name === 'status');
    expect(status?.default).toBe(DeliveryStatus.PENDING);
  });

  it('has nullable sent_at and error columns', () => {
    const config = getTableConfig(notificationDeliveries);
    const sentAt = config.columns.find((c) => c.name === 'sent_at');
    const error = config.columns.find((c) => c.name === 'error');
    expect(sentAt?.notNull).toBe(false);
    expect(error?.notNull).toBe(false);
  });

  it('has timestamptz for created_at and updated_at', () => {
    const config = getTableConfig(notificationDeliveries);
    const timestamps = config.columns.filter((c) => ['created_at', 'updated_at'].includes(c.name));
    expect(timestamps).toHaveLength(2);
    timestamps.forEach((col) => expect(col.getSQLType()).toBe('timestamp with time zone'));
  });

  it('notificationChannelEnum contains all NotificationChannel values', () => {
    const values = Object.values(NotificationChannel);
    values.forEach((v) => {
      expect(notificationChannelEnum.enumValues).toContain(v);
    });
  });

  it('deliveryStatusEnum contains all DeliveryStatus values', () => {
    const values = Object.values(DeliveryStatus);
    values.forEach((v) => {
      expect(deliveryStatusEnum.enumValues).toContain(v);
    });
  });

  it('deliveryStatusEnum has exactly 3 values', () => {
    expect(deliveryStatusEnum.enumValues).toHaveLength(3);
  });
});
