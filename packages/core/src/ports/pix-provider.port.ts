import type {
  AutomaticAuthorization,
  AutomaticSchedule,
  CancelInput,
  Charge,
  CreateAuthorizationInput,
  CreateChargeInput,
  PixWebhookEvent,
  ProviderName,
  Refund,
  RefundInput,
  ScheduleInput,
  WebhookHeaders,
} from '../domain/types.js';

export interface PixAutomaticProvider {
  createAuthorization(input: CreateAuthorizationInput): Promise<AutomaticAuthorization>;
  getAuthorization(id: string): Promise<AutomaticAuthorization>;
  schedule(input: ScheduleInput): Promise<AutomaticSchedule>;
  cancel(input: CancelInput): Promise<void>;
}

export interface PixProvider {
  readonly name: ProviderName;
  createCharge(input: CreateChargeInput): Promise<Charge>;
  getCharge(id: string): Promise<Charge>;
  refund(input: RefundInput): Promise<Refund>;
  parseWebhook(payload: unknown, headers: WebhookHeaders): Promise<PixWebhookEvent>;
  readonly automatic: PixAutomaticProvider;
}

export interface WebhookSignatureVerifier {
  verify(payload: string | Buffer, headers: WebhookHeaders, secret: string): boolean;
}

export interface MetricsSink {
  increment(name: string, tags?: Record<string, string>): void;
  histogram(name: string, value: number, tags?: Record<string, string>): void;
}

export interface PixPlugin {
  readonly name: string;
  onBefore?(ctx: PluginContext): Promise<void>;
  onAfter?(ctx: PluginContext): Promise<void>;
  onError?(ctx: PluginContext, error: import('../domain/errors.js').PixError): Promise<void>;
}

export interface PluginContext {
  operation: string;
  provider: ProviderName;
  input?: unknown;
  output?: unknown;
  startTime: number;
}
