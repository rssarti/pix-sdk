import {
  PixError,
  PixNotFoundError,
  PixProviderError,
  PixValidationError,
  PixWebhookError,
} from '../src/domain/errors.js';

describe('Pix errors', () => {
  it('PixError stores options', () => {
    const err = new PixError({
      code: 'NETWORK_ERROR',
      message: 'fail',
      provider: 'mock',
      retryable: true,
      cause: new Error('root'),
    });
    expect(err.name).toBe('PixError');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.provider).toBe('mock');
    expect(err.retryable).toBe(true);
    expect(err.cause).toBeInstanceOf(Error);
  });

  it('specialized errors set codes', () => {
    expect(new PixValidationError('bad').code).toBe('VALIDATION_ERROR');
    expect(new PixNotFoundError('missing', 'mock').code).toBe('NOT_FOUND');
    expect(new PixProviderError('down', 'mock', false).retryable).toBe(false);
    expect(new PixWebhookError('sig').code).toBe('WEBHOOK_SIGNATURE_INVALID');
  });
});
