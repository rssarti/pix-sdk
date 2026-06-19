export type ProviderMode = 'mock' | 'sandbox' | 'production';
export interface BaseProviderConfig { mode?: ProviderMode; mockBaseUrl?: string; sandboxBaseUrl?: string; productionBaseUrl?: string; }
export function resolveBaseUrl(config: BaseProviderConfig, envPrefix: string): string {
  const mode = config.mode ?? (process.env.PIX_PROVIDER_MODE as ProviderMode) ?? 'mock';
  if (mode === 'mock') return config.mockBaseUrl ?? process.env[`${envPrefix}_MOCK_URL`] ?? process.env.PIX_MOCK_URL ?? 'http://localhost:3333';
  if (mode === 'sandbox') return config.sandboxBaseUrl ?? process.env[`${envPrefix}_SANDBOX_URL`] ?? '';
  return config.productionBaseUrl ?? process.env[`${envPrefix}_PRODUCTION_URL`] ?? '';
}
