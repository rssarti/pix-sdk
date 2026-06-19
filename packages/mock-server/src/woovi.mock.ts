import { generateTxid } from '@rssarti/pix-shared';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface WooviChargeRecord {
  correlationID: string;
  transactionID: string;
  identifier: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  value: number;
  comment?: string;
  brCode: string;
  qrCodeImage?: string;
  paymentLinkUrl?: string;
  expiresDate: string;
  expiresIn: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface WooviSubscriptionRecord {
  globalID: string;
  value: number;
  status: string;
  dayGenerateCharge: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    taxID: { taxID: string; type: string };
  };
  createdAt: string;
}

export interface WooviStore {
  wooviCharges: Map<string, WooviChargeRecord>;
  wooviSubscriptions: Map<string, WooviSubscriptionRecord>;
  wooviRefunds: Map<string, { chargeCorrelationID: string; correlationID: string; value: number; status: string }>;
}

export function createWooviStore(): WooviStore {
  return {
    wooviCharges: new Map(),
    wooviSubscriptions: new Map(),
    wooviRefunds: new Map(),
  };
}

function buildBrCode(txid: string): string {
  return `00020126580014br.gov.bcb.pix0136${txid}5204000053039865802BR5913Woovi Mock6009SAO PAULO62070503***6304ABCD`;
}

function buildCharge(
  correlationID: string,
  value: number,
  comment?: string,
  expiresIn = 86400,
): WooviChargeRecord {
  const now = new Date();
  const transactionID = generateTxid();
  const expiresDate = new Date(now.getTime() + expiresIn * 1000);
  const brCode = buildBrCode(transactionID);
  return {
    correlationID,
    transactionID,
    identifier: transactionID,
    status: 'ACTIVE',
    value,
    comment,
    brCode,
    qrCodeImage: `http://localhost/openpix/charge/brcode/image/${correlationID}.png`,
    paymentLinkUrl: `http://localhost/pay/${correlationID}`,
    expiresDate: expiresDate.toISOString(),
    expiresIn,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function chargePayload(charge: WooviChargeRecord) {
  return {
    charge,
    correlationID: charge.correlationID,
    brCode: charge.brCode,
  };
}

export async function handleWooviRoute(
  store: WooviStore,
  method: string,
  path: string,
  readBody: (req: IncomingMessage) => Promise<unknown>,
  req: IncomingMessage,
  res: ServerResponse,
  sendJson: (res: ServerResponse, status: number, data: unknown) => void,
): Promise<boolean> {
  if (method === 'POST' && path === '/api/v1/charge') {
    const body = (await readBody(req)) as {
      correlationID?: string;
      value?: number;
      comment?: string;
      expiresIn?: number;
    };
    const correlationID = body.correlationID ?? randomUUID();
    const charge = buildCharge(correlationID, body.value ?? 100, body.comment, body.expiresIn);
    store.wooviCharges.set(correlationID, charge);
    sendJson(res, 201, chargePayload(charge));
    return true;
  }

  if (method === 'GET' && path.startsWith('/api/v1/charge/') && !path.endsWith('/refund')) {
    const correlationID = decodeURIComponent(path.split('/')[4] ?? '');
    const charge = store.wooviCharges.get(correlationID);
    if (!charge) {
      sendJson(res, 404, { error: 'Charge not found' });
      return true;
    }
    sendJson(res, 200, chargePayload(charge));
    return true;
  }

  if (method === 'POST' && path.match(/^\/api\/v1\/charge\/[^/]+\/refund$/)) {
    const chargeCorrelationID = decodeURIComponent(path.split('/')[4] ?? '');
    const charge = store.wooviCharges.get(chargeCorrelationID);
    if (!charge) {
      sendJson(res, 404, { error: 'Charge not found' });
      return true;
    }
    const body = (await readBody(req)) as { correlationID?: string; value?: number };
    const refundCorrelationID = body.correlationID ?? randomUUID();
    const refundValue = body.value ?? charge.value;
    charge.status = 'COMPLETED';
    store.wooviCharges.set(chargeCorrelationID, charge);
    const refund = {
      correlationID: refundCorrelationID,
      value: refundValue,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    store.wooviRefunds.set(refundCorrelationID, {
      chargeCorrelationID,
      ...refund,
    });
    sendJson(res, 201, { refund, correlationID: refundCorrelationID });
    return true;
  }

  if (method === 'POST' && path === '/api/v1/subscriptions') {
    const body = (await readBody(req)) as {
      value?: number;
      customer?: { name?: string; taxID?: string; email?: string; phone?: string };
      dayGenerateCharge?: number;
    };
    const globalID = `sub_${generateTxid()}`;
    const subscription: WooviSubscriptionRecord = {
      globalID,
      value: body.value ?? 100,
      status: 'ACTIVE',
      dayGenerateCharge: body.dayGenerateCharge ?? 5,
      customer: {
        name: body.customer?.name ?? 'Cliente',
        email: body.customer?.email ?? 'cliente@example.com',
        phone: body.customer?.phone ?? '5511999999999',
        taxID: { taxID: body.customer?.taxID ?? '00000000000', type: 'BR:CPF' },
      },
      createdAt: new Date().toISOString(),
    };
    store.wooviSubscriptions.set(globalID, subscription);
    sendJson(res, 201, { subscription });
    return true;
  }

  if (method === 'GET' && path.startsWith('/api/v1/subscriptions/')) {
    const id = decodeURIComponent(path.split('/')[4] ?? '');
    const subscription = store.wooviSubscriptions.get(id);
    if (!subscription) {
      sendJson(res, 404, { error: 'Subscription not found' });
      return true;
    }
    sendJson(res, 200, { subscription });
    return true;
  }

  if (method === 'DELETE' && path.startsWith('/api/v1/subscriptions/')) {
    const id = decodeURIComponent(path.split('/')[4] ?? '');
    const subscription = store.wooviSubscriptions.get(id);
    if (!subscription) {
      sendJson(res, 404, { error: 'Subscription not found' });
      return true;
    }
    subscription.status = 'CANCELLED';
    store.wooviSubscriptions.set(id, subscription);
    sendJson(res, 200, { subscription });
    return true;
  }

  if (method === 'POST' && path === '/api/v1/webhook/simulate') {
    const body = (await readBody(req)) as { event?: string; correlationID?: string };
    const charge = body.correlationID ? store.wooviCharges.get(body.correlationID) : undefined;
    if (charge && body.event?.includes('COMPLETED')) {
      charge.status = 'COMPLETED';
      charge.paidAt = new Date().toISOString();
      store.wooviCharges.set(charge.correlationID, charge);
    }
    sendJson(res, 200, {
      event: body.event ?? 'OPENPIX:CHARGE_COMPLETED',
      charge,
      pix: charge
        ? {
            endToEndId: `E${generateTxid()}`,
            transactionID: charge.transactionID,
            value: charge.value,
            time: charge.paidAt,
          }
        : undefined,
    });
    return true;
  }

  return false;
}
