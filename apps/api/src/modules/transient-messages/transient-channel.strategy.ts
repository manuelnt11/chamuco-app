import type { TransientMessageType } from '@chamuco/shared-types';

export interface TransientChannelStrategy {
  send(type: TransientMessageType, payload: Record<string, unknown>): Promise<void>;
}
