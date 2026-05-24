import type { TransientMessageType } from '@chamuco/shared-types';

export interface TransientContent {
  subject: string;
  body: string;
}

export interface TransientChannelStrategy {
  send(
    type: TransientMessageType,
    payload: Record<string, unknown>,
    content: TransientContent,
  ): Promise<void>;
}
