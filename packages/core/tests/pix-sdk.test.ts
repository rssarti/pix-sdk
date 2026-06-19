import { PixSDK, LoggingPlugin, MetricsPlugin, NoopMetricsSink, pixEventEmitter } from '../src/index.js';
import { InMemoryProvider } from './in-memory.provider.js';
import { createHmacSignature } from '@rssarti/pix-shared';
import { HmacWebhookVerifier } from '../src/webhooks/webhook.service.js';

describe('PixSDK', () => {
  const provider = new InMemoryProvider();

  it('creates and retrieves a charge', async () => {
    const pix = new PixSDK({ provider });
    const charge = await pix.createCharge({ amount: 100, description: 'Test' });
    expect(charge.amount.amount).toBe(100);
    expect(charge.status).toBe('ACTIVE');
    const fetched = await pix.getCharge(charge.txid);
    expect(fetched.txid).toBe(charge.txid);
  });

  it('processes refund', async () => {
    const pix = new PixSDK({ provider });
    const refund = await pix.refund({ transactionId: 'e2e123', amount: 50 });
    expect(refund.amount.amount).toBe(50);
    expect(refund.status).toBe('COMPLETED');
  });

  it('runs plugin pipeline', async () => {
    const sink = new NoopMetricsSink();
    const increment = jest.spyOn(sink, 'increment');
    const pix = new PixSDK({
      provider,
      plugins: [new LoggingPlugin(), new MetricsPlugin(sink)],
    });
    await pix.createCharge({ amount: 10 });
    expect(increment).toHaveBeenCalled();
  });

  it('parses webhooks with idempotency', async () => {
    const listener = jest.fn();
    pixEventEmitter.onEvent('PIX_PAID', listener);
    const pix = new PixSDK({ provider });
    const event = await pix.webhooks.parse({ eventId: 'evt-1', txid: 'abc' }, {});
    expect(event.type).toBe('PIX_PAID');
    expect(listener).toHaveBeenCalledTimes(1);
    const duplicate = await pix.webhooks.parse({ eventId: 'evt-1', txid: 'abc' }, {});
    expect(duplicate.eventId).toBe('evt-1');
    expect(listener).toHaveBeenCalledTimes(1);
    pixEventEmitter.removeAllListeners('PIX_PAID');
  });

  it('supports automatic pix flow', async () => {
    const pix = new PixSDK({ provider });
    const auth = await pix.automatic.createAuthorization({
      contractId: 'c1',
      debtorDocument: '12345678901',
      amount: 99.9,
    });
    expect(auth.status).toBe('CREATED');
    const schedule = await pix.automatic.schedule({ authorizationId: auth.id, amount: 99.9 });
    expect(schedule.status).toBe('SCHEDULED');
    await pix.automatic.cancel({ authorizationId: auth.id });
    const updated = await pix.automatic.getAuthorization(auth.id);
    expect(updated.status).toBe('CANCELLED');
  });

  it('registers plugins via use()', async () => {
    const pix = new PixSDK({ provider }).use(new LoggingPlugin());
    await expect(pix.createCharge({ amount: 1 })).resolves.toMatchObject({ status: 'ACTIVE' });
  });

  it('wraps provider errors as validation errors', async () => {
    const pix = new PixSDK({ provider });
    await expect(pix.getCharge('missing-txid')).rejects.toMatchObject({ name: 'PixNotFoundError' });
  });

  it('verifies webhook signature when secret provided', async () => {
    const secret = 'webhook-secret';
    const raw = JSON.stringify({ eventId: 'sig-1', txid: 't1' });
    const sig = createHmacSignature(raw, secret);
    const pix = new PixSDK({
      provider,
      webhookSecret: secret,
      signatureVerifier: new HmacWebhookVerifier(),
    });
    await expect(pix.webhooks.parse(JSON.parse(raw), { 'x-pix-signature': sig }, raw)).resolves.toMatchObject({
      eventId: 'sig-1',
    });
    await expect(
      pix.webhooks.parse(JSON.parse(raw), { 'x-pix-signature': 'bad' }, raw),
    ).rejects.toMatchObject({ name: 'PixWebhookError' });
  });
});
