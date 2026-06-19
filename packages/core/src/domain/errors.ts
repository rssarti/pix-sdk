export type PixErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'REFUND_FAILED'
  | 'CHARGE_EXPIRED'
  | 'UNKNOWN';

export interface PixErrorOptions {
  code: PixErrorCode;
  message: string;
  provider?: string;
  retryable?: boolean;
  cause?: unknown;
}

export class PixError extends Error {
  readonly code: PixErrorCode;
  readonly provider?: string;
  readonly retryable: boolean;

  constructor(options: PixErrorOptions) {
    super(options.message);
    this.name = 'PixError';
    this.code = options.code;
    this.provider = options.provider;
    this.retryable = options.retryable ?? false;
    if (options.cause) this.cause = options.cause;
  }
}

export class PixValidationError extends PixError {
  constructor(message: string, cause?: unknown) {
    super({ code: 'VALIDATION_ERROR', message, retryable: false, cause });
    this.name = 'PixValidationError';
  }
}

export class PixNotFoundError extends PixError {
  constructor(message: string, provider?: string) {
    super({ code: 'NOT_FOUND', message, provider, retryable: false });
    this.name = 'PixNotFoundError';
  }
}

export class PixProviderError extends PixError {
  constructor(message: string, provider: string, retryable = true, cause?: unknown) {
    super({ code: 'PROVIDER_ERROR', message, provider, retryable, cause });
    this.name = 'PixProviderError';
  }
}

export class PixWebhookError extends PixError {
  constructor(message: string) {
    super({ code: 'WEBHOOK_SIGNATURE_INVALID', message, retryable: false });
    this.name = 'PixWebhookError';
  }
}
