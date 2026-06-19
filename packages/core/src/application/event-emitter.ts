import { EventEmitter } from 'node:events';
import type { PixWebhookEvent } from '../domain/types.js';

export type PixEventMap = {
  PIX_PAID: PixWebhookEvent;
  PIX_REFUNDED: PixWebhookEvent;
  PIX_EXPIRED: PixWebhookEvent;
  PIX_AUTOMATIC_AUTHORIZED: PixWebhookEvent;
  PIX_AUTOMATIC_REJECTED: PixWebhookEvent;
  PIX_AUTOMATIC_SCHEDULED: PixWebhookEvent;
  PIX_AUTOMATIC_CANCELLED: PixWebhookEvent;
};

export class PixEventEmitter extends EventEmitter {
  emitEvent<K extends keyof PixEventMap>(event: K, data: PixEventMap[K]): boolean {
    return this.emit(event, data);
  }

  onEvent<K extends keyof PixEventMap>(
    event: K,
    listener: (data: PixEventMap[K]) => void,
  ): this {
    return this.on(event, listener);
  }
}

export const pixEventEmitter = new PixEventEmitter();
