import type { Charge, PixProvider, PixWebhookEvent } from '@rssarti/pix-core';
import { MockProvider } from '@rssarti/pix-provider-mock';
import { resolveBaseUrl, type BaseProviderConfig } from '@rssarti/pix-shared';

export interface MercadoPagoConfig extends BaseProviderConfig {
  accessToken?: string;
}

function mapMpChargeToCanonical(charge: Charge): Charge {
  return { ...charge, id: charge.txid };
}

export class MercadoPagoProvider implements PixProvider {
  readonly name = 'mercadopago' as const;
  readonly automatic: PixProvider['automatic'];
  private readonly delegate: MockProvider;

  constructor(config: MercadoPagoConfig = {}) {
    this.delegate = new MockProvider({ baseUrl: resolveBaseUrl(config, 'MP') });
    this.automatic = this.delegate.automatic;
  }

  async createCharge(input: Parameters<MockProvider['createCharge']>[0]): Promise<Charge> {
    return mapMpChargeToCanonical(await this.delegate.createCharge(input));
  }

  getCharge = async (id: string) => mapMpChargeToCanonical(await this.delegate.getCharge(id));
  refund = (input: Parameters<MockProvider['refund']>[0]) => this.delegate.refund(input);
  parseWebhook = (payload: unknown, headers: Record<string, string | string[] | undefined>): Promise<PixWebhookEvent> => {
    const mpPayload = payload as { type?: string; data?: { id?: string } };
    if (mpPayload.type === 'payment') {
      return this.delegate.parseWebhook({ type: 'PIX_PAID', txid: mpPayload.data?.id, ...mpPayload }, headers);
    }
    return this.delegate.parseWebhook(payload, headers);
  };
}
