import type { ProviderMode } from '@rssarti/pix-shared';

export interface WooviConfig {
  mode?: ProviderMode;
  mockBaseUrl?: string;
  sandboxBaseUrl?: string;
  productionBaseUrl?: string;
  appId?: string;
}

export function resolveWooviBaseUrl(config: WooviConfig): string {
  const mode =
    config.mode ??
    (process.env.WOOVI_MODE as ProviderMode | undefined) ??
    (process.env.PIX_PROVIDER_MODE as ProviderMode | undefined) ??
    'mock';

  if (mode === 'mock') {
    return (
      config.mockBaseUrl ??
      process.env.WOOVI_MOCK_URL ??
      process.env.PIX_MOCK_URL ??
      'http://localhost:3333'
    );
  }

  if (mode === 'sandbox') {
    return (
      config.sandboxBaseUrl ??
      process.env.WOOVI_SANDBOX_URL ??
      'https://api.woovi-sandbox.com'
    );
  }

  return (
    config.productionBaseUrl ??
    process.env.WOOVI_PRODUCTION_URL ??
    'https://api.woovi.com'
  );
}

export function resolveWooviAppId(config: WooviConfig): string {
  return config.appId ?? process.env.WOOVI_APP_ID ?? '';
}

export function isWooviMockMode(config: WooviConfig): boolean {
  const mode =
    config.mode ??
    (process.env.WOOVI_MODE as ProviderMode | undefined) ??
    (process.env.PIX_PROVIDER_MODE as ProviderMode | undefined) ??
    'mock';
  return mode === 'mock';
}
