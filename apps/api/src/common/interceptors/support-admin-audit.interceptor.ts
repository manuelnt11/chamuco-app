import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InferSelectModel, sql } from 'drizzle-orm';
import { Observable, catchError, from, mergeMap, tap, throwError } from 'rxjs';

import { AUDIT_TARGET_KEY, AuditTargetMetadata } from '@/common/decorators/audit-target.decorator';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { supportAdminAuditLog } from '@/modules/users/schema/support-admin-audit-log.schema';
import { users } from '@/modules/users/schema/users.schema';
import { PlatformRole } from '@chamuco/shared-types';

type AuthenticatedUser = InferSelectModel<typeof users>;

/** HTTP methods that represent write operations and must be audited. */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Nil UUID used as target_id when a POST operation fails before record creation.
 * Intentionally a nil UUID (not random) so auditors can easily query failed creates:
 * `WHERE target_id = '00000000-0000-0000-0000-000000000000' AND action = 'CREATE'`.
 */
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Allowlist regex for table names passed to `sql.raw()`.
 * Accepts only lowercase snake_case identifiers — matches what drizzle-kit generates.
 * URL-derived names (untrusted) are validated before use; decorator-provided names
 * are developer-authored and safe by design.
 */
const TABLE_NAME_RE = /^[a-z_][a-z0-9_]*$/;

/** Maps HTTP method to a human-readable action label stored in the audit log. */
const METHOD_TO_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Global interceptor that logs every write operation performed by a SUPPORT_ADMIN user
 * to the immutable `support_admin_audit_log` table.
 *
 * Short-circuits immediately (zero overhead) for:
 *   - Non-SUPPORT_ADMIN users
 *   - Read-only methods (GET, HEAD, OPTIONS)
 *
 * Behaviour per write request:
 *   1. Resolve target_table and target_id from @AuditTarget metadata or URL.
 *   2. Capture before_state by querying the DB (skipped for POST — record does not exist yet).
 *   3. Execute the handler.
 *   4. On success: persist audit entry with after_state from the response body.
 *   5. On error: persist audit entry with after_state = null, then re-throw.
 */
@Injectable()
export class SupportAdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SupportAdminAuditInterceptor.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      user?: AuthenticatedUser;
      params: Record<string, string>;
      path: string;
    }>();

    const { method, user } = request;

    // Short-circuit: only audit SUPPORT_ADMIN write operations.
    if (!user || user.platformRole !== PlatformRole.SUPPORT_ADMIN || !WRITE_METHODS.has(method)) {
      return next.handle();
    }

    return from(this.buildAuditContext(context, request)).pipe(
      mergeMap(({ targetTable, targetId, beforeState, action }) =>
        next.handle().pipe(
          tap((responseBody: unknown) => {
            void this.writeAuditLog({
              adminUserId: user.id,
              action,
              targetTable,
              targetId,
              beforeState,
              afterState: responseBody ?? null,
            });
          }),
          catchError((error: unknown) => {
            void this.writeAuditLog({
              adminUserId: user.id,
              action,
              targetTable,
              targetId,
              beforeState,
              afterState: null,
            });
            return throwError(() => error);
          }),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async buildAuditContext(
    context: ExecutionContext,
    request: { method: string; params: Record<string, string>; path: string },
  ): Promise<{
    targetTable: string;
    targetId: string;
    beforeState: Record<string, unknown> | null;
    action: string;
  }> {
    const { method, params, path } = request;
    const action = METHOD_TO_ACTION[method] ?? method;

    const metadata = this.reflector.getAllAndOverride<AuditTargetMetadata | undefined>(
      AUDIT_TARGET_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { targetTable, rawTargetId } = this.resolveTarget(metadata, params, path);

    // POST creates a new record — no before_state to capture.
    const isCreate = method === 'POST';
    const beforeState =
      !isCreate && rawTargetId ? await this.fetchBeforeState(targetTable, rawTargetId) : null;

    // For failed POSTs the record was never created; use a nil UUID as placeholder.
    const targetId = rawTargetId ?? NIL_UUID;

    return { targetTable, targetId, beforeState, action };
  }

  /**
   * Resolves the target table and raw target ID from decorator metadata (preferred)
   * or the URL path as a fallback.
   *
   * The `@AuditTarget` decorator is the authoritative source. URL-based resolution is
   * a best-effort fallback for routes without the decorator — add `@AuditTarget` to any
   * route where precise auditing matters.
   *
   * URL fallback: /api/v1/users/abc-123 → table='users', id='abc-123'
   */
  private resolveTarget(
    metadata: AuditTargetMetadata | undefined,
    params: Record<string, string>,
    path: string,
  ): { targetTable: string; rawTargetId: string | null } {
    if (metadata) {
      return {
        targetTable: metadata.table,
        rawTargetId: params[metadata.idParam] ?? null,
      };
    }

    this.logger.warn(
      `No @AuditTarget on handler for "${path}" — falling back to URL-based resolution. ` +
        `Add @AuditTarget to suppress this warning and ensure accurate auditing.`,
    );

    // URL fallback: derive table from path, prefer req.params for the ID.
    const segments = path.split('/').filter(Boolean);
    const last = segments.at(-1) ?? '';
    const secondLast = segments.at(-2) ?? 'unknown';
    const looksLikeId = /^[0-9a-f-]{8,}$/i.test(last) || /^\d+$/.test(last);

    // req.params is more reliable than URL parsing — use the first param value when present.
    const firstParamValue = Object.values(params)[0] ?? null;
    const rawTargetId = firstParamValue ?? (looksLikeId ? last : null);

    return {
      targetTable: looksLikeId ? secondLast : last,
      rawTargetId,
    };
  }

  private async fetchBeforeState(
    targetTable: string,
    targetId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!TABLE_NAME_RE.test(targetTable)) {
      this.logger.warn(`Skipping before_state fetch: unexpected table name "${targetTable}"`);
      return null;
    }
    try {
      // targetTable is validated against TABLE_NAME_RE above — safe to use as identifier.
      const result = await this.db.execute(
        sql`SELECT * FROM ${sql.raw(`"${targetTable}"`)} WHERE id = ${targetId}`,
      );
      return (result[0] as Record<string, unknown>) ?? null;
    } catch (error) {
      this.logger.warn(`Failed to fetch before_state from ${targetTable}: ${String(error)}`);
      return null;
    }
  }

  private async writeAuditLog(entry: {
    adminUserId: string;
    action: string;
    targetTable: string;
    targetId: string;
    beforeState: Record<string, unknown> | null;
    afterState: unknown;
  }): Promise<void> {
    try {
      await this.db.insert(supportAdminAuditLog).values({
        adminUserId: entry.adminUserId,
        action: entry.action,
        targetTable: entry.targetTable,
        targetId: entry.targetId,
        beforeState: entry.beforeState as Record<string, unknown> | null,
        afterState: entry.afterState as Record<string, unknown> | null,
      });
    } catch (error) {
      // Never let an audit log failure propagate to the caller.
      this.logger.error(`Failed to write audit log entry: ${String(error)}`);
    }
  }
}
