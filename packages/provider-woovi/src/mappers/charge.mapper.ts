import type { Charge, ChargeStatus, Refund } from '@rssarti/pix-core';
import type { WooviCharge, WooviRefund } from '../schemas/woovi.schemas.js';

const statusMap: Record<string, ChargeStatus> = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
};

export function reaisToCentavos(amount: number): number {
  return Math.round(amount * 100);
}

export function centavosToReais(centavos: number): number {
  return centavos / 100;
}

export function mapWooviChargeToCanonical(charge: WooviCharge): Charge {
  const txid = charge.transactionID ?? charge.identifier ?? charge.correlationID;
  return {
    id: charge.correlationID,
    txid,
    status: statusMap[charge.status] ?? 'ACTIVE',
    amount: { amount: centavosToReais(charge.value), currency: 'BRL' },
    description: charge.comment,
    pixCopyPaste: charge.brCode,
    qrCode: charge.qrCodeImage ?? charge.brCode,
    createdAt: new Date(charge.createdAt ?? Date.now()),
    expiresAt: charge.expiresDate ? new Date(charge.expiresDate) : undefined,
  };
}

export function mapCreateChargeBody(input: {
  amount: number;
  description?: string;
  correlationID: string;
  expirationSeconds?: number;
}): Record<string, unknown> {
  return {
    correlationID: input.correlationID,
    value: reaisToCentavos(input.amount),
    comment: input.description,
    expiresIn: input.expirationSeconds,
  };
}

export function mapWooviRefundToCanonical(
  transactionId: string,
  refund: WooviRefund,
): Refund {
  const statusMap: Record<string, Refund['status']> = {
    IN_PROCESSING: 'PROCESSING',
    PROCESSING: 'PROCESSING',
    CONFIRMED: 'COMPLETED',
    COMPLETED: 'COMPLETED',
    REJECTED: 'FAILED',
    FAILED: 'FAILED',
  };
  return {
    id: refund.correlationID,
    transactionId,
    amount: {
      amount: refund.value != null ? centavosToReais(refund.value) : 0,
      currency: 'BRL',
    },
    status: statusMap[refund.status ?? 'PROCESSING'] ?? 'PROCESSING',
    createdAt: new Date(refund.createdAt ?? Date.now()),
  };
}
