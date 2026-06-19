import { PluginHost, createPluginContext } from '../src/application/plugin-host.js';
import { PixValidationError } from '../src/domain/errors.js';
import type { PixPlugin } from '../src/ports/pix-provider.port.js';

describe('PluginHost', () => {
  it('runs plugin hooks', async () => {
    const calls: string[] = [];
    const plugin: PixPlugin = {
      name: 'test',
      onBefore: async () => { calls.push('before'); },
      onAfter: async () => { calls.push('after'); },
      onError: async () => { calls.push('error'); },
    };
    const host = new PluginHost();
    host.register(plugin);
    expect(host.getPlugins()).toHaveLength(1);
    const ctx = createPluginContext('createCharge', 'mock', {});
    await host.runBefore(ctx);
    await host.runAfter(ctx);
    await host.runError(ctx, new PixValidationError('x'));
    expect(calls).toEqual(['before', 'after', 'error']);
  });
});
