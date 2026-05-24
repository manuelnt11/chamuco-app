import { TransientMessageType } from '@chamuco/shared-types';
import { normalizeI18nArgs, toI18nPrefix } from '@/common/utils/i18n-content.utils';

export interface TransientContent {
  subjectKey: string;
  bodyKey: string;
  args: Record<string, string | number | boolean>;
}

export function buildTransientContent(
  type: TransientMessageType,
  payload: Record<string, unknown>,
): TransientContent {
  const prefix = toI18nPrefix(type);
  return {
    subjectKey: `transient.${prefix}.subject`,
    bodyKey: `transient.${prefix}.body`,
    args: normalizeI18nArgs(payload),
  };
}
