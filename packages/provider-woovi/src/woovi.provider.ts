import {
  PixNotFoundError,
  PixProviderError,
  type Charge,
  type CreateChargeInput,
  type PixProvider,
  type PixWebhookEvent,
  type Refund,
  type RefundInput,
  type WebhookHeaders,
} from '@rssarti/pix-core';
import { randomUUID } from 'node:crypto';
import { WooviAutomaticProvider } from './woovi.automatic.js';
import { WooviClient } from './woovi.client.js';
import {
  mapCreateChargeBody,
  mapWooviChargeToCanonical,
  mapWooviRefundToCanonical,
  reaisToCentavos,
} from './mappers/charge.mapper.js';
import { mapWooviWebhook } from './mappers/webhook.mapper.js';
import { resolveWooviBaseUrl, type WooviConfig } from './woovi.config.js';

export type { WooviConfig } from './woovi.config.js';

export class WooviProvider implements PixProvider {
  readonly name = 'woovi' as const;
  readonly automatic: WooviAutomaticProvider;
  private readonly client: WooviClient;

  constructor(config: WooviConfig = {}) {
    const baseUrl = resolveWooviBaseUrl(config);
    this.client = new WooviClient({ ...config, baseUrl });
    this.automatic = new WooviAutomaticProvider(this.client);
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    const correlationID = randomUUID();
    try {
      const response = await this.client.createCharge(
        mapCreateChargeBody({ ...input, correlationID }),
      );
      return mapWooviChargeToCanonical(response.charge);
    } catch (error) {
      throw new PixProviderError('Failed to create charge', 'woovi', true, error);
    }
  }

  async getCharge(id: string): Promise<Charge> {
    try {
      const response = await this.client.getCharge(id);
      return mapWooviChargeToCanonical(response.charge);
    } catch {
      throw new PixNotFoundError(`Charge ${id} not found`, 'woovi');
    }
  }

  async refund(input: RefundInput): Promise<Refund> {
    const refundCorrelationID = input.refundId ?? randomUUID();
    try {
      const response = await this.client.refundCharge(input.transactionId, {
        correlationID: refundCorrelationID,
        value: reaisToCentavos(input.amount),
      });
      const refund = response.refund ?? { correlationID: refundCorrelationID, value: reaisToCentavos(input.amount) };
      return mapWooviRefundToCanonical(input.transactionId, refund);
    } catch (error) {
      throw new PixProviderError('Failed to refund charge', 'woovi', true, error);
    }
  }

  async parseWebhook(payload: unknown, _headers: WebhookHeaders): Promise<PixWebhookEvent> {
    return mapWooviWebhook(payload);
  }
}
