import { pixEventEmitter } from '../src/application/event-emitter.js';
import { LoggingPlugin } from '../src/plugins/logging.plugin.js';
import { MetricsPlugin, NoopMetricsSink } from '../src/plugins/metrics.plugin.js';
import { PixValidationError } from '../src/domain/errors.js';
import type { PluginContext } from '../src/ports/pix-provider.port.js';

describe('plugins and events', () => {
  it('emits webhook events once', () => {
    const listener = jest.fn();
    pixEventEmitter.onEvent('PIX_PAID', listener);
    const payload = {
      type: 'PIX_PAID' as const,
      eventId: 'evt-emit',
      transactionId: 'tx',
      timestamp: new Date(),
      raw: {},
    };
    expect(pixEventEmitter.emitEvent('PIX_PAID', payload)).toBe(true);
    pixEventEmitter.removeAllListeners('PIX_PAID');
  });

  it('logs and records metrics on error', async () => {
    const ctx: PluginContext = { operation: 'refund', provider: 'mock', startTime: Date.now() };
    const sink = new NoopMetricsSink();
    const increment = jest.spyOn(sink, 'increment');
    await new LoggingPlugin().onError(ctx, new PixValidationError('boom'));
    await new MetricsPlugin(sink).onError(ctx, new PixValidationError('boom'));
    expect(increment).toHaveBeenCalledWith('pix.errors', expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});
