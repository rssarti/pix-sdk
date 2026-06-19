import {
  PixNotFoundError,
  PixProviderError,
  type CancelInput,
  type Charge,
  type CreateAuthorizationInput,
  type CreateChargeInput,
  type PixAutomaticProvider,
  type PixProvider,
  type PixWebhookEvent,
  type Refund,
  type RefundInput,
  type ScheduleInput,
  type WebhookHeaders,
} from '@rssarti/pix-core';
import { HttpClient, bacenCobSchema, bacenDevolucaoSchema, bacenRecSchema, generateTxid } from '@rssarti/pix-shared';
import {
  mapBacenCobToCharge,
  mapBacenDevolucaoToRefund,
  mapBacenRecToAuthorization,
  mapChargeToBacenCob,
  mapScheduleResponse,
} from './mappers/charge.mapper.js';
import { mapSimulatedWebhook } from './mappers/webhook.mapper.js';

export interface MockProviderOptions {
  baseUrl?: string;
}

class MockAutomaticProvider implements PixAutomaticProvider {
  constructor(private readonly http: HttpClient) {}

  async createAuthorization(input: CreateAuthorizationInput) {
    const body = {
      vinculo: {
        contrato: input.contractId,
        devedor: { cpf: input.debtorDocument, nome: input.debtorName },
      },
      calendario: {
        dataInicial: new Date().toISOString().slice(0, 10),
        periodicidade: input.periodicity
          ? { WEEKLY: 'SEMANAL', MONTHLY: 'MENSAL', QUARTERLY: 'TRIMESTRAL', SEMIANNUAL: 'SEMESTRAL', ANNUAL: 'ANUAL' }[
              input.periodicity
            ]
          : 'MENSAL',
      },
      valor: { valorRec: input.amount.toFixed(2) },
    };
    const rec = await this.http.post<unknown>('/rec', body);
    const parsed = bacenRecSchema.parse(rec);
    return mapBacenRecToAuthorization(parsed);
  }

  async getAuthorization(id: string) {
    try {
      const rec = await this.http.get<unknown>(`/rec/${id}`);
      return mapBacenRecToAuthorization(bacenRecSchema.parse(rec));
    } catch {
      throw new PixNotFoundError(`Authorization ${id} not found`, 'mock');
    }
  }

  async schedule(input: ScheduleInput) {
    const response = await this.http.post<{ idCobR?: string }>('/cobr', {
      idRec: input.authorizationId,
      valor: input.amount.toFixed(2),
    });
    return mapScheduleResponse(response.idCobR ?? generateTxid(), input.authorizationId, input.amount);
  }

  async cancel(input: CancelInput) {
    await this.http.patch(`/rec/${input.authorizationId}`, { status: 'CANCELADA' });
  }
}

export class MockProvider implements PixProvider {
  readonly name = 'mock' as const;
  readonly automatic: PixAutomaticProvider;
  private readonly http: HttpClient;

  constructor(options: MockProviderOptions = {}) {
    const baseUrl = options.baseUrl ?? process.env.PIX_MOCK_URL ?? 'http://localhost:3333';
    this.http = new HttpClient({ baseURL: baseUrl });
    this.automatic = new MockAutomaticProvider(this.http);
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    try {
      const cob = await this.http.post<unknown>('/cob', mapChargeToBacenCob(input));
      return mapBacenCobToCharge(bacenCobSchema.parse(cob));
    } catch (error) {
      throw new PixProviderError('Failed to create charge', 'mock', true, error);
    }
  }

  async getCharge(id: string): Promise<Charge> {
    try {
      const cob = await this.http.get<unknown>(`/cob/${id}`);
      return mapBacenCobToCharge(bacenCobSchema.parse(cob));
    } catch {
      throw new PixNotFoundError(`Charge ${id} not found`, 'mock');
    }
  }

  async refund(input: RefundInput): Promise<Refund> {
    const refundId = input.refundId ?? generateTxid().slice(0, 35);
    try {
      const dev = await this.http.put<unknown>(
        `/pix/${input.transactionId}/devolucao/${refundId}`,
        { valor: input.amount.toFixed(2) },
      );
      return mapBacenDevolucaoToRefund(input.transactionId, bacenDevolucaoSchema.parse(dev));
    } catch (error) {
      throw new PixProviderError('Failed to refund', 'mock', true, error);
    }
  }

  async parseWebhook(payload: unknown, _headers: WebhookHeaders): Promise<PixWebhookEvent> {
    return mapSimulatedWebhook(payload);
  }
}
