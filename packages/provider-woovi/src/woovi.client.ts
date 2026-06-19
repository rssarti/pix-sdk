import { PixProviderError } from '@rssarti/pix-core';
import { HttpClient } from '@rssarti/pix-shared';
import {
  wooviChargeResponseSchema,
  wooviRefundResponseSchema,
  wooviSubscriptionResponseSchema,
} from './schemas/woovi.schemas.js';
import { reaisToCentavos } from './mappers/charge.mapper.js';
import { isWooviMockMode, resolveWooviAppId, type WooviConfig } from './woovi.config.js';

export interface WooviClientOptions extends WooviConfig {
  baseUrl: string;
}

export class WooviClient {
  private readonly http: HttpClient;
  private readonly appId: string;
  private readonly mockMode: boolean;

  constructor(options: WooviClientOptions) {
    this.appId = resolveWooviAppId(options);
    this.mockMode = isWooviMockMode(options);
    this.http = new HttpClient({
      baseURL: options.baseUrl,
      headers: this.appId ? { Authorization: this.appId } : undefined,
    });
  }

  private ensureAppId(): void {
    if (!this.mockMode && !this.appId) {
      throw new PixProviderError(
        'WOOVI_APP_ID is required for sandbox/production',
        'woovi',
        false,
      );
    }
  }

  async createCharge(body: Record<string, unknown>) {
    this.ensureAppId();
    const response = await this.http.post<unknown>('/api/v1/charge', body);
    return wooviChargeResponseSchema.parse(response);
  }

  async getCharge(correlationID: string) {
    this.ensureAppId();
    const response = await this.http.get<unknown>(`/api/v1/charge/${correlationID}`);
    return wooviChargeResponseSchema.parse(response);
  }

  async refundCharge(
    chargeCorrelationID: string,
    body: { correlationID: string; value?: number; comment?: string },
  ) {
    this.ensureAppId();
    const response = await this.http.post<unknown>(
      `/api/v1/charge/${chargeCorrelationID}/refund`,
      body,
    );
    return wooviRefundResponseSchema.parse(response);
  }

  async createSubscription(body: Record<string, unknown>) {
    this.ensureAppId();
    const response = await this.http.post<unknown>('/api/v1/subscriptions', body);
    return wooviSubscriptionResponseSchema.parse(response);
  }

  async getSubscription(id: string) {
    this.ensureAppId();
    const response = await this.http.get<unknown>(`/api/v1/subscriptions/${id}`);
    return wooviSubscriptionResponseSchema.parse(response);
  }

  async cancelSubscription(id: string) {
    this.ensureAppId();
    await this.http.delete(`/api/v1/subscriptions/${id}`);
  }

  buildSubscriptionBody(input: {
    amount: number;
    debtorDocument: string;
    debtorName?: string;
    email?: string;
    phone?: string;
  }) {
    return {
      value: reaisToCentavos(input.amount),
      customer: {
        name: input.debtorName ?? 'Cliente',
        taxID: input.debtorDocument,
        email: input.email ?? `${input.debtorDocument}@example.com`,
        phone: input.phone ?? '5511999999999',
      },
    };
  }
}
