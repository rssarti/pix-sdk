import { verifyHmacSignature } from '@rssarti/pix-shared';
import type { PixWebhookEvent, WebhookHeaders } from '../domain/types.js';
import { PixWebhookError } from '../domain/errors.js';
import type { WebhookSignatureVerifier } from '../ports/pix-provider.port.js';

export class WebhookNormalizer {
  normalize(event: PixWebhookEvent): PixWebhookEvent {
    return {
      ...event,
      timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
    };
  }
}

export class WebhookService {
  private readonly seenEvents = new Set<string>();

  constructor(
    private readonly signatureVerifier?: WebhookSignatureVerifier,
    private readonly normalizer = new WebhookNormalizer(),
  ) {}

  verifySignature(
    payload: string | Buffer,
    headers: WebhookHeaders,
    secret: string,
  ): void {
    if (!this.signatureVerifier) return;
    const valid = this.signatureVerifier.verify(payload, headers, secret);
    if (!valid) throw new PixWebhookError('Invalid webhook signature');
  }

  normalize(event: PixWebhookEvent): PixWebhookEvent {
    return this.normalizer.normalize(event);
  }

  isDuplicate(eventId: string): boolean {
    if (this.seenEvents.has(eventId)) return true;
    this.seenEvents.add(eventId);
    return false;
  }
}

export class HmacWebhookVerifier implements WebhookSignatureVerifier {
  verify(payload: string | Buffer, headers: WebhookHeaders, secret: string): boolean {
    const signature = headers['x-pix-signature'] ?? headers['X-Pix-Signature'];
    if (!signature || Array.isArray(signature)) return false;
    const body = typeof payload === 'string' ? payload : payload.toString('utf8');
    return verifyHmacSignature(body, signature, secret);
  }
}
