import {
  PixNotFoundError,
  PixProviderError,
  type AutomaticAuthorization,
  type AutomaticSchedule,
  type CancelInput,
  type CreateAuthorizationInput,
  type PixAutomaticProvider,
  type ScheduleInput,
} from '@rssarti/pix-core';
import { generateTxid } from '@rssarti/pix-shared';
import type { WooviClient } from './woovi.client.js';
import type { WooviSubscription } from './schemas/woovi.schemas.js';
import { centavosToReais } from './mappers/charge.mapper.js';

const subscriptionStatusMap: Record<string, AutomaticAuthorization['status']> = {
  ACTIVE: 'APPROVED',
  APPROVED: 'APPROVED',
  CREATED: 'CREATED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  INACTIVE: 'CANCELLED',
};

function mapSubscription(sub: WooviSubscription, contractId?: string): AutomaticAuthorization {
  const taxId =
    typeof sub.customer?.taxID === 'string'
      ? sub.customer.taxID
      : sub.customer?.taxID?.taxID;

  return {
    id: sub.globalID,
    status: subscriptionStatusMap[sub.status ?? 'CREATED'] ?? 'CREATED',
    contractId,
    debtorDocument: taxId,
    debtorName: sub.customer?.name,
    amount: { amount: centavosToReais(sub.value), currency: 'BRL' },
    periodicity: 'MONTHLY',
    createdAt: new Date(sub.createdAt ?? Date.now()),
  };
}

export class WooviAutomaticProvider implements PixAutomaticProvider {
  constructor(private readonly client: WooviClient) {}

  async createAuthorization(input: CreateAuthorizationInput): Promise<AutomaticAuthorization> {
    try {
      const response = await this.client.createSubscription(
        this.client.buildSubscriptionBody({
          amount: input.amount,
          debtorDocument: input.debtorDocument,
          debtorName: input.debtorName,
        }),
      );
      return mapSubscription(response.subscription, input.contractId);
    } catch (error) {
      throw new PixProviderError('Failed to create subscription', 'woovi', true, error);
    }
  }

  async getAuthorization(id: string): Promise<AutomaticAuthorization> {
    try {
      const response = await this.client.getSubscription(id);
      return mapSubscription(response.subscription);
    } catch {
      throw new PixNotFoundError(`Subscription ${id} not found`, 'woovi');
    }
  }

  async schedule(input: ScheduleInput): Promise<AutomaticSchedule> {
    return {
      id: generateTxid(),
      authorizationId: input.authorizationId,
      amount: { amount: input.amount, currency: 'BRL' },
      scheduledAt: input.scheduledAt ?? new Date(),
      status: 'SCHEDULED',
    };
  }

  async cancel(input: CancelInput): Promise<void> {
    try {
      await this.client.cancelSubscription(input.authorizationId);
    } catch (error) {
      throw new PixProviderError('Failed to cancel subscription', 'woovi', true, error);
    }
  }
}
