import type { PixWebhookEvent } from '@rssarti/pix-core';
import type { WooviCharge } from '../schemas/woovi.schemas.js';
import { centavosToReais } from './charge.mapper.js';

const eventTypeMap: Record<string, PixWebhookEvent['type']> = {
  'OPENPIX:CHARGE_COMPLETED': 'PIX_PAID',
  'woovi:CHARGE_COMPLETED': 'PIX_PAID',
  'OPENPIX:CHARGE_EXPIRED': 'PIX_EXPIRED',
  'woovi:CHARGE_EXPIRED': 'PIX_EXPIRED',
  'OPENPIX:TRANSACTION_RECEIVED': 'PIX_PAID',
  'PIX_TRANSACTION_REFUND_SENT_CONFIRMED': 'PIX_REFUNDED',
  'PIX_TRANSACTION_REFUND_RECEIVED_CONFIRMED': 'PIX_REFUNDED',
  PIX_AUTOMATIC_APPROVED: 'PIX_AUTOMATIC_AUTHORIZED',
  PIX_AUTOMATIC_REJECTED: 'PIX_AUTOMATIC_REJECTED',
  PIX_AUTOMATIC_COBR_CREATED: 'PIX_AUTOMATIC_SCHEDULED',
  PIX_AUTOMATIC_COBR_APPROVED: 'PIX_AUTOMATIC_SCHEDULED',
  PIX_AUTOMATIC_COBR_COMPLETED: 'PIX_PAID',
  PIX_AUTOMATIC_COBR_REJECTED: 'PIX_AUTOMATIC_REJECTED',
};

function extractCharge(payload: Record<string, unknown>): WooviCharge | undefined {
  const charge = payload.charge as WooviCharge | undefined;
  if (charge?.correlationID) return charge;
  const pix = payload.pix as { charge?: WooviCharge; transactionID?: string; endToEndId?: string } | undefined;
  return pix?.charge;
}

export function mapWooviWebhook(payload: unknown): PixWebhookEvent {
  const data = payload as Record<string, unknown>;
  const event = String(data.event ?? '');
  const charge = extractCharge(data);
  const pix = data.pix as
    | { endToEndId?: string; transactionID?: string; value?: number; time?: string }
    | undefined;

  const transactionId =
    charge?.correlationID ??
    charge?.transactionID ??
    pix?.transactionID ??
    pix?.endToEndId ??
    '';

  const amountValue = charge?.value ?? pix?.value;

  return {
    type: eventTypeMap[event] ?? 'PIX_PAID',
    eventId: pix?.endToEndId ?? charge?.transactionID ?? transactionId ?? String(Date.now()),
    transactionId,
    amount:
      amountValue != null
        ? { amount: centavosToReais(amountValue), currency: 'BRL' }
        : undefined,
    timestamp: new Date(pix?.time ?? charge?.paidAt ?? Date.now()),
    raw: payload,
  };
}
