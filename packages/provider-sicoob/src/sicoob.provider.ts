import type { PixProvider } from '@rssarti/pix-core';
import { MockProvider } from '@rssarti/pix-provider-mock';
import { resolveBaseUrl, type BaseProviderConfig } from '@rssarti/pix-shared';

export interface SicoobConfig extends BaseProviderConfig {
  clientId?: string;
  clientSecret?: string;
  certPath?: string;
  keyPath?: string;
}

export class SicoobProvider implements PixProvider {
  readonly name = 'sicoob' as const;
  readonly automatic: PixProvider['automatic'];
  private readonly delegate: MockProvider;

  constructor(config: SicoobConfig = {}) {
    this.delegate = new MockProvider({ baseUrl: resolveBaseUrl(config, 'SICOOB') });
    this.automatic = this.delegate.automatic;
  }

  createCharge = (input: Parameters<MockProvider['createCharge']>[0]) => this.delegate.createCharge(input);
  getCharge = (id: string) => this.delegate.getCharge(id);
  refund = (input: Parameters<MockProvider['refund']>[0]) => this.delegate.refund(input);
  parseWebhook = (payload: unknown, headers: Parameters<MockProvider['parseWebhook']>[1]) =>
    this.delegate.parseWebhook(payload, headers);
}
