import { RetryPlugin } from '../src/plugins/retry.plugin.js';
import { PixProviderError, PixValidationError } from '../src/domain/errors.js';
import type { PluginContext } from '../src/ports/pix-provider.port.js';

const ctx: PluginContext = { operation: 'createCharge', provider: 'mock', input: { a: 1 }, startTime: Date.now() };

describe('RetryPlugin', () => {
  it('ignores non-retryable errors', async () => {
    const plugin = new RetryPlugin({ baseDelayMs: 1 });
    await expect(plugin.onError(ctx, new PixValidationError('x'))).resolves.toBeUndefined();
  });

  it('retries until max attempts', async () => {
    const plugin = new RetryPlugin({ maxAttempts: 2, baseDelayMs: 1 });
    const err = new PixProviderError('fail', 'mock', true);
    await expect(plugin.onError(ctx, err)).rejects.toMatchObject({ message: 'Retry attempt 1' });
    await expect(plugin.onError(ctx, err)).rejects.toMatchObject({ message: 'Retry attempt 2' });
    await expect(plugin.onError(ctx, err)).resolves.toBeUndefined();
    plugin.reset();
  });
});
