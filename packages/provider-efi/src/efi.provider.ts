import type { PixProvider } from '@rssarti/pix-core';
import { MockProvider } from '@rssarti/pix-provider-mock';
import { resolveBaseUrl, type BaseProviderConfig } from '@rssarti/pix-shared';

export interface EfiConfig extends BaseProviderConfig {
  clientId?: string;
  clientSecret?: string;
  certPath?: string;
}

export class EfiProvider implements PixProvider {
  readonly name = 'efi' as const;
  readonly automatic: PixProvider['automatic'];
  private readonly delegate: MockProvider;

  constructor(config: EfiConfig = {}) {
    const baseUrl = resolveBaseUrl(config, 'EFI');
    this.delegate = new MockProvider({ baseUrl });
    this.automatic = this.delegate.automatic;
  }

  createCharge = (input: Parameters<MockProvider['createCharge']>[0]) => this.delegate.createCharge(input);
  getCharge = (id: string) => this.delegate.getCharge(id);
  refund = (input: Parameters<MockProvider['refund']>[0]) => this.delegate.refund(input);
  parseWebhook = (payload: unknown, headers: Parameters<MockProvider['parseWebhook']>[1]) =>
    this.delegate.parseWebhook(payload, headers);
}
