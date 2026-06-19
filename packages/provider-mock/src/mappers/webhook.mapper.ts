import type { PixWebhookEvent } from '@rssarti/pix-core';

export function mapSimulatedWebhook(payload: unknown): PixWebhookEvent {
  const data = payload as Record<string, unknown>;
  const type = (data.type as string) ?? (data.event as string) ?? 'PIX_PAID';
  const eventTypeMap: Record<string, PixWebhookEvent['type']> = {
    PIX_RECEBIDO: 'PIX_PAID',
    PIX_PAID: 'PIX_PAID',
    PIX_DEVOLVIDO: 'PIX_REFUNDED',
    PIX_REFUNDED: 'PIX_REFUNDED',
    PIX_EXPIRADO: 'PIX_EXPIRED',
    REC_APROVADA: 'PIX_AUTOMATIC_AUTHORIZED',
    REC_REJEITADA: 'PIX_AUTOMATIC_REJECTED',
    COBR_AGENDADA: 'PIX_AUTOMATIC_SCHEDULED',
    REC_CANCELADA: 'PIX_AUTOMATIC_CANCELLED',
  };
  return {
    type: eventTypeMap[type] ?? 'PIX_PAID',
    eventId: (data.eventId as string) ?? (data.endToEndId as string) ?? String(Date.now()),
    transactionId: (data.txid as string) ?? (data.endToEndId as string) ?? '',
    amount: data.amount
      ? { amount: parseFloat(String(data.amount)), currency: 'BRL' }
      : undefined,
    timestamp: new Date(),
    raw: payload,
  };
}
