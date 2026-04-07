import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from '@/modules/users/schema/users.schema';

/**
 * Immutable audit log for all write actions performed by SUPPORT_ADMIN users.
 * This table is append-only — no UPDATE or DELETE is permitted.
 * Enforcement: DB-level trigger (prevent_support_admin_audit_log_mutation) + service layer.
 */
export const supportAdminAuditLog = pgTable(
  'support_admin_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    targetTable: text('target_table').notNull(),
    targetId: uuid('target_id').notNull(), // No FK — the referenced record may be deleted; the audit entry must outlive it
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
    performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('support_admin_audit_log_admin_user_id_idx').on(table.adminUserId),
    index('support_admin_audit_log_performed_at_idx').on(table.performedAt),
  ],
);
