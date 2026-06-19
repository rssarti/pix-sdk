import type { PixError } from '../domain/errors.js';
import type { ProviderName } from '../domain/types.js';
import type { PixPlugin, PluginContext } from '../ports/pix-provider.port.js';

export class PluginHost {
  private plugins: PixPlugin[] = [];

  register(plugin: PixPlugin): void {
    this.plugins.push(plugin);
  }

  getPlugins(): readonly PixPlugin[] {
    return this.plugins;
  }

  async runBefore(ctx: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.onBefore?.(ctx);
    }
  }

  async runAfter(ctx: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.onAfter?.(ctx);
    }
  }

  async runError(ctx: PluginContext, error: PixError): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.onError?.(ctx, error);
    }
  }
}

export function createPluginContext(
  operation: string,
  provider: ProviderName,
  input?: unknown,
): PluginContext {
  return { operation, provider, input, startTime: Date.now() };
}
