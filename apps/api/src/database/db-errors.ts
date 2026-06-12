const PG_UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  if (e.code === PG_UNIQUE_VIOLATION) return true;
  // DrizzleQueryError wraps the underlying PostgresError in `cause`
  const cause = e.cause;
  return (
    typeof cause === 'object' &&
    cause !== null &&
    (cause as Record<string, unknown>).code === PG_UNIQUE_VIOLATION
  );
}
