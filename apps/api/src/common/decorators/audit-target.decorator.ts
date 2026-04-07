import { SetMetadata } from '@nestjs/common';

export interface AuditTargetMetadata {
  /** Database table name of the resource being modified. */
  table: string;
  /** Route param key that holds the resource ID. Defaults to 'id'. */
  idParam: string;
}

export const AUDIT_TARGET_KEY = 'auditTarget';

/**
 * Marks a route handler as an auditable write endpoint.
 *
 * Required for SupportAdminAuditInterceptor to capture before/after state.
 * Only meaningful on POST / PUT / PATCH / DELETE handlers.
 *
 * @param table   - Exact table name in the DB (e.g. 'users', 'trips').
 * @param idParam - Route param key for the resource ID. Defaults to 'id'.
 *
 * @example
 * @AuditTarget('users')          // expects req.params.id
 * @AuditTarget('trips', 'tripId') // expects req.params.tripId
 */
export const AuditTarget = (table: string, idParam = 'id'): MethodDecorator =>
  SetMetadata<string, AuditTargetMetadata>(AUDIT_TARGET_KEY, { table, idParam });
