import { PixError } from '../domain/errors.js';
import type { PixPlugin, PluginContext } from '../ports/pix-provider.port.js';

export interface RetryPluginOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

export class RetryPlugin implements PixPlugin {
  readonly name = 'retry';
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private retryCounts = new Map<string, number>();

  constructor(options: RetryPluginOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 100;
  }

  async onError(ctx: PluginContext, error: PixError): Promise<void> {
    if (!error.retryable) return;
    const key = `${ctx.operation}:${JSON.stringify(ctx.input)}`;
    const count = this.retryCounts.get(key) ?? 0;
    if (count >= this.maxAttempts) return;
    this.retryCounts.set(key, count + 1);
    const delay = this.baseDelayMs * Math.pow(2, count);
    await new Promise((resolve) => setTimeout(resolve, delay));
    throw new PixError({
      code: 'PROVIDER_ERROR',
      message: `Retry attempt ${count + 1}`,
      retryable: true,
    });
  }

  reset(): void {
    this.retryCounts.clear();
  }
}
