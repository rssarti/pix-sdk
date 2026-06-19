import { PixError, PixValidationError } from '../domain/errors.js';
import type {
  CancelInput,
  Charge,
  CreateAuthorizationInput,
  CreateChargeInput,
  PixWebhookEvent,
  Refund,
  RefundInput,
  ScheduleInput,
  WebhookHeaders,
} from '../domain/types.js';
import type { PixPlugin, PixProvider } from '../ports/pix-provider.port.js';
import { createPluginContext, PluginHost } from './plugin-host.js';
import { pixEventEmitter } from './event-emitter.js';
import { WebhookService } from '../webhooks/webhook.service.js';
import type { WebhookSignatureVerifier } from '../ports/pix-provider.port.js';

export interface PixSDKOptions {
  provider: PixProvider;
  plugins?: PixPlugin[];
  webhookSecret?: string;
  signatureVerifier?: WebhookSignatureVerifier;
}

export class PixSDK {
  readonly provider: PixProvider;
  readonly automatic: PixProvider['automatic'];
  readonly webhooks: WebhookFacade;
  private readonly pluginHost: PluginHost;

  constructor(options: PixSDKOptions) {
    this.provider = options.provider;
    this.automatic = options.provider.automatic;
    this.pluginHost = new PluginHost();
    for (const plugin of options.plugins ?? []) {
      this.pluginHost.register(plugin);
    }
    this.webhooks = new WebhookFacade(
      options.provider,
      new WebhookService(options.signatureVerifier),
      options.webhookSecret,
    );
  }

  use(plugin: PixPlugin): this {
    this.pluginHost.register(plugin);
    return this;
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    return this.execute('createCharge', input, () => this.provider.createCharge(input));
  }

  async getCharge(id: string): Promise<Charge> {
    return this.execute('getCharge', { id }, () => this.provider.getCharge(id));
  }

  async refund(input: RefundInput): Promise<Refund> {
    return this.execute('refund', input, () => this.provider.refund(input));
  }

  private async execute<T>(
    operation: string,
    input: unknown,
    fn: () => Promise<T>,
  ): Promise<T> {
    const ctx = createPluginContext(operation, this.provider.name, input);
    await this.pluginHost.runBefore(ctx);
    try {
      const output = await fn();
      ctx.output = output;
      await this.pluginHost.runAfter(ctx);
      return output;
    } catch (error) {
      const pixError =
        error instanceof PixError
          ? error
          : new PixValidationError(
              error instanceof Error ? error.message : 'Unknown error',
              error,
            );
      await this.pluginHost.runError(ctx, pixError);
      throw pixError;
    }
  }
}

class WebhookFacade {
  constructor(
    private readonly provider: PixProvider,
    private readonly webhookService: WebhookService,
    private readonly secret?: string,
  ) {}

  async parse(
    payload: unknown,
    headers: WebhookHeaders,
    rawBody?: string | Buffer,
  ): Promise<PixWebhookEvent> {
    if (this.secret && rawBody) {
      this.webhookService.verifySignature(rawBody, headers, this.secret);
    }
    const event = await this.provider.parseWebhook(payload, headers);
    const normalized = this.webhookService.normalize(event);
    if (!this.webhookService.isDuplicate(normalized.eventId)) {
      pixEventEmitter.emitEvent(normalized.type, normalized);
    }
    return normalized;
  }
}

export { pixEventEmitter };
