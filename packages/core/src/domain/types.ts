export type ProviderName = 'mock' | 'efi' | 'mercadopago' | 'itau' | 'sicoob' | 'woovi';

export type ChargeStatus = 'ACTIVE' | 'COMPLETED' | 'REMOVED' | 'EXPIRED';

export interface Money {
  amount: number;
  currency: 'BRL';
}

export interface PixKey {
  type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  value: string;
}

export interface Charge {
  id: string;
  txid: string;
  status: ChargeStatus;
  amount: Money;
  description?: string;
  pixCopyPaste?: string;
  qrCode?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: Money;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

export interface PixTransaction {
  endToEndId: string;
  txid?: string;
  amount: Money;
  paidAt: Date;
  payer?: { name?: string; document?: string };
}

export type PixWebhookEventType =
  | 'PIX_PAID'
  | 'PIX_REFUNDED'
  | 'PIX_EXPIRED'
  | 'PIX_AUTOMATIC_AUTHORIZED'
  | 'PIX_AUTOMATIC_REJECTED'
  | 'PIX_AUTOMATIC_SCHEDULED'
  | 'PIX_AUTOMATIC_CANCELLED';

export interface PixWebhookEvent {
  type: PixWebhookEventType;
  eventId: string;
  transactionId: string;
  amount?: Money;
  timestamp: Date;
  raw?: unknown;
}

export interface AutomaticAuthorization {
  id: string;
  status: 'CREATED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  contractId?: string;
  debtorDocument?: string;
  debtorName?: string;
  amount?: Money;
  periodicity?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  createdAt: Date;
}

export interface AutomaticSchedule {
  id: string;
  authorizationId: string;
  amount: Money;
  scheduledAt: Date;
  status: 'SCHEDULED' | 'PAID' | 'CANCELLED';
}

export interface CreateChargeInput {
  amount: number;
  description?: string;
  pixKey?: string;
  expirationSeconds?: number;
}

export interface RefundInput {
  transactionId: string;
  amount: number;
  refundId?: string;
}

export interface CreateAuthorizationInput {
  contractId: string;
  debtorDocument: string;
  debtorName?: string;
  amount: number;
  periodicity?: AutomaticAuthorization['periodicity'];
}

export interface ScheduleInput {
  authorizationId: string;
  amount: number;
  scheduledAt?: Date;
}

export interface CancelInput {
  authorizationId: string;
  reason?: string;
}

export type WebhookHeaders = Record<string, string | string[] | undefined>;
