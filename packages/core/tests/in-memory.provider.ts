import type {
  CancelInput,
  Charge,
  CreateAuthorizationInput,
  CreateChargeInput,
  PixAutomaticProvider,
  PixProvider,
  PixWebhookEvent,
  Refund,
  RefundInput,
  ScheduleInput,
  WebhookHeaders,
} from '../src/domain/types.js';
import { PixNotFoundError } from '../src/domain/errors.js';
import { generateTxid } from '@rssarti/pix-shared';

export class InMemoryProvider implements PixProvider {
  readonly name = 'mock' as const;
  readonly automatic: PixAutomaticProvider;
  private charges = new Map<string, Charge>();
  private refunds = new Map<string, Refund>();
  private authorizations = new Map<string, import('../src/domain/types.js').AutomaticAuthorization>();

  constructor() {
    this.automatic = {
      createAuthorization: async (input: CreateAuthorizationInput) => {
        const id = generateTxid();
        const auth = {
          id,
          status: 'CREATED' as const,
          contractId: input.contractId,
          debtorDocument: input.debtorDocument,
          debtorName: input.debtorName,
          amount: { amount: input.amount, currency: 'BRL' as const },
          periodicity: input.periodicity,
          createdAt: new Date(),
        };
        this.authorizations.set(id, auth);
        return auth;
      },
      getAuthorization: async (id: string) => {
        const auth = this.authorizations.get(id);
        if (!auth) throw new PixNotFoundError(`Authorization ${id} not found`);
        return auth;
      },
      schedule: async (input: ScheduleInput) => ({
        id: generateTxid(),
        authorizationId: input.authorizationId,
        amount: { amount: input.amount, currency: 'BRL' },
        scheduledAt: input.scheduledAt ?? new Date(),
        status: 'SCHEDULED' as const,
      }),
      cancel: async (input: CancelInput) => {
        const auth = this.authorizations.get(input.authorizationId);
        if (auth) this.authorizations.set(input.authorizationId, { ...auth, status: 'CANCELLED' });
      },
    };
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    const txid = generateTxid();
    const charge: Charge = {
      id: txid,
      txid,
      status: 'ACTIVE',
      amount: { amount: input.amount, currency: 'BRL' },
      description: input.description,
      pixCopyPaste: `mock-pix-${txid}`,
      createdAt: new Date(),
    };
    this.charges.set(txid, charge);
    return charge;
  }

  async getCharge(id: string): Promise<Charge> {
    const charge = this.charges.get(id);
    if (!charge) throw new PixNotFoundError(`Charge ${id} not found`);
    return charge;
  }

  async refund(input: RefundInput): Promise<Refund> {
    const refund: Refund = {
      id: input.refundId ?? generateTxid(),
      transactionId: input.transactionId,
      amount: { amount: input.amount, currency: 'BRL' },
      status: 'COMPLETED',
      createdAt: new Date(),
    };
    this.refunds.set(refund.id, refund);
    return refund;
  }

  async parseWebhook(payload: unknown, _headers: WebhookHeaders): Promise<PixWebhookEvent> {
    const data = payload as Record<string, unknown>;
    return {
      type: 'PIX_PAID',
      eventId: String(data.eventId ?? Date.now()),
      transactionId: String(data.transactionId ?? data.txid ?? ''),
      timestamp: new Date(),
      raw: payload,
    };
  }
}
