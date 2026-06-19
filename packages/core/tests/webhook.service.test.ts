import {
  HmacWebhookVerifier,
  WebhookNormalizer,
  WebhookService,
} from '../src/webhooks/webhook.service.js';
import { PixWebhookError } from '../src/domain/errors.js';
import { createHmacSignature } from '@rssarti/pix-shared';

describe('WebhookService', () => {
  it('normalizes timestamp', () => {
    const normalizer = new WebhookNormalizer();
    const iso = '2020-01-01T00:00:00.000Z';
    const event = normalizer.normalize({
      type: 'PIX_PAID',
      eventId: 'e1',
      transactionId: 't1',
      timestamp: iso,
      raw: {},
    });
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('tracks duplicate events', () => {
    const svc = new WebhookService();
    expect(svc.isDuplicate('id')).toBe(false);
    expect(svc.isDuplicate('id')).toBe(true);
  });

  it('verifies signature via HMAC', () => {
    const body = '{"ok":true}';
    const secret = 's3cret';
    const sig = createHmacSignature(body, secret);
    const svc = new WebhookService(new HmacWebhookVerifier());
    expect(() => svc.verifySignature(body, { 'x-pix-signature': sig }, secret)).not.toThrow();
    expect(() => svc.verifySignature(body, { 'x-pix-signature': 'bad' }, secret)).toThrow(PixWebhookError);
  });

  it('skips verify when no verifier', () => {
    const svc = new WebhookService();
    expect(() => svc.verifySignature('x', {}, 's')).not.toThrow();
  });
});
