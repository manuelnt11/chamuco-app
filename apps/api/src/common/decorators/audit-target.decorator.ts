import { SetMetadata } from '@nestjs/common';

export interface AuditTargetMetadata {
  /** Database table name of the resource being modified. */
  table: string;
  /** Route param key that holds the resource ID. Defaults to 'id'. */
  idParam: string;
}

export const AUDIT_TARGET_KEY = 'auditTarget';

/**
 * Provides explicit table and ID-param metadata to `SupportAdminAuditInterceptor`.
 *
 * Optional — the interceptor falls back to URL-based resolution when absent, but that
 * heuristic is imprecise and logs a warning. Decorate every write handler that a
 * SUPPORT_ADMIN may invoke to ensure accurate before/after state capture.
 *
 * Only meaningful on POST / PUT / PATCH / DELETE handlers.
 *
 * @param table   - Exact table name in the DB (e.g. 'users', 'trips').
 * @param idParam - Route param key for the resource ID. Defaults to 'id'.
 *
 * @example
 * @AuditTarget('users')           // expects req.params.id
 * @AuditTarget('trips', 'tripId') // expects req.params.tripId
 */
export const AuditTarget = (table: string, idParam = 'id'): MethodDecorator =>
  SetMetadata<string, AuditTargetMetadata>(AUDIT_TARGET_KEY, { table, idParam });
