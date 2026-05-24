import { TransientMessageType } from '@chamuco/shared-types';

export interface TransientContent {
  subjectKey: string;
  bodyKey: string;
  args: Record<string, string | number | boolean>;
}

function toI18nPrefix(type: TransientMessageType): string {
  return type.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function normalizeArgs(
  payload: Record<string, unknown>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
      .map(([k, v]) => [k, v as string | number | boolean]),
  );
}

export function buildTransientContent(
  type: TransientMessageType,
  payload: Record<string, unknown>,
): TransientContent {
  const prefix = toI18nPrefix(type);
  return {
    subjectKey: `transient.${prefix}.subject`,
    bodyKey: `transient.${prefix}.body`,
    args: normalizeArgs(payload),
  };
}
