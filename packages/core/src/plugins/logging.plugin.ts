import pino from 'pino';
import type { PixError } from '../domain/errors.js';
import type { PixPlugin, PluginContext } from '../ports/pix-provider.port.js';

export class LoggingPlugin implements PixPlugin {
  readonly name = 'logging';
  private readonly logger = pino({ name: 'pix-sdk' });

  async onBefore(ctx: PluginContext): Promise<void> {
    this.logger.info({ operation: ctx.operation, provider: ctx.provider }, 'pix operation start');
  }

  async onAfter(ctx: PluginContext): Promise<void> {
    const duration = Date.now() - ctx.startTime;
    this.logger.info(
      { operation: ctx.operation, provider: ctx.provider, durationMs: duration },
      'pix operation complete',
    );
  }

  async onError(ctx: PluginContext, error: PixError): Promise<void> {
    this.logger.error(
      { operation: ctx.operation, provider: ctx.provider, err: error, code: error.code },
      'pix operation failed',
    );
  }
}
