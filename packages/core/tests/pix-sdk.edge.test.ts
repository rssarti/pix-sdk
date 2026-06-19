import { PixSDK, MetricsPlugin, pixEventEmitter } from '../src/index.js';
import { InMemoryProvider } from './in-memory.provider.js';
import { PixError } from '../src/domain/errors.js';
import { HmacWebhookVerifier } from '../src/webhooks/webhook.service.js';
import type { PixProvider } from '../src/ports/pix-provider.port.js';

class FailingProvider extends InMemoryProvider {
  async getCharge(): Promise<never> {
    throw 'not-an-error';
  }
}

describe('PixSDK edge cases', () => {
  it('wraps non-error throws', async () => {
    const pix = new PixSDK({ provider: new FailingProvider() });
    await expect(pix.getCharge('x')).rejects.toMatchObject({ message: 'Unknown error' });
  });

  it('metrics plugin uses default sink', async () => {
    const plugin = new MetricsPlugin();
    await plugin.onAfter({
      operation: 'createCharge',
      provider: 'mock',
      startTime: Date.now() - 5,
    });
  });

  it('HMAC verifier accepts alternate header', () => {
    const verifier = new HmacWebhookVerifier();
    expect(verifier.verify('body', { 'X-Pix-Signature': ['a', 'b'] }, 'secret')).toBe(false);
  });

  it('rethrows PixError unchanged', async () => {
    const provider: PixProvider = {
      ...new InMemoryProvider(),
      name: 'mock',
      async createCharge() {
        throw new PixError({ code: 'PROVIDER_ERROR', message: 'provider down' });
      },
    };
    const pix = new PixSDK({ provider });
    await expect(pix.createCharge({ amount: 1 })).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
  });
});
