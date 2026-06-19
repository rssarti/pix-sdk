import type { MetricsSink, PixPlugin, PluginContext } from '../ports/pix-provider.port.js';
import type { PixError } from '../domain/errors.js';

export class NoopMetricsSink implements MetricsSink {
  increment(): void {}
  histogram(): void {}
}

export class MetricsPlugin implements PixPlugin {
  readonly name = 'metrics';
  private readonly sink: MetricsSink;

  constructor(sink: MetricsSink = new NoopMetricsSink()) {
    this.sink = sink;
  }

  async onAfter(ctx: PluginContext): Promise<void> {
    const duration = Date.now() - ctx.startTime;
    this.sink.increment('pix.operations', { operation: ctx.operation, provider: ctx.provider });
    this.sink.histogram('pix.operation.duration', duration, {
      operation: ctx.operation,
      provider: ctx.provider,
    });
  }

  async onError(ctx: PluginContext, error: PixError): Promise<void> {
    this.sink.increment('pix.errors', {
      operation: ctx.operation,
      provider: ctx.provider,
      code: error.code,
    });
  }
}
