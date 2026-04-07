import { getTableConfig } from 'drizzle-orm/pg-core';

import { supportAdminAuditLog } from './support-admin-audit-log.schema';

describe('supportAdminAuditLog schema', () => {
  it('exports the supportAdminAuditLog table', () => {
    expect(supportAdminAuditLog).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(supportAdminAuditLog);
    expect(config.name).toBe('support_admin_audit_log');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(supportAdminAuditLog);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'admin_user_id',
        'action',
        'target_table',
        'target_id',
        'before_state',
        'after_state',
        'performed_at',
      ]),
    );
  });

  it('does not have an updated_at column (append-only)', () => {
    const config = getTableConfig(supportAdminAuditLog);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).not.toContain('updated_at');
  });

  it('has performed_at as timestamptz', () => {
    const config = getTableConfig(supportAdminAuditLog);
    const performedAt = config.columns.find((c) => c.name === 'performed_at');
    expect(performedAt?.getSQLType()).toBe('timestamp with time zone');
  });

  it('has before_state and after_state as nullable jsonb', () => {
    const config = getTableConfig(supportAdminAuditLog);
    const beforeState = config.columns.find((c) => c.name === 'before_state');
    const afterState = config.columns.find((c) => c.name === 'after_state');
    expect(beforeState?.notNull).toBe(false);
    expect(afterState?.notNull).toBe(false);
  });

  it('has admin_user_id as not null', () => {
    const config = getTableConfig(supportAdminAuditLog);
    const adminUserId = config.columns.find((c) => c.name === 'admin_user_id');
    expect(adminUserId?.notNull).toBe(true);
  });

  it('has a FK from admin_user_id to users.id with RESTRICT on delete', () => {
    const config = getTableConfig(supportAdminAuditLog);
    expect(config.foreignKeys).toHaveLength(1);
    const fk = config.foreignKeys[0]!;
    expect(fk.reference().columns[0]?.name).toBe('admin_user_id');
    expect(fk.reference().foreignColumns[0]?.name).toBe('id');
    expect(fk.onDelete).toBe('restrict');
  });

  it('has indexes on admin_user_id and performed_at', () => {
    const config = getTableConfig(supportAdminAuditLog);
    const indexNames = config.indexes.map((i) => i.config.name);
    expect(indexNames).toContain('support_admin_audit_log_admin_user_id_idx');
    expect(indexNames).toContain('support_admin_audit_log_performed_at_idx');
  });
});
