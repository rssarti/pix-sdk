import { PixSDK, MockProvider } from '@rssarti/pix-sdk';
import { createMockServer } from '@rssarti/pix-mock-server';
import { bacenCobSchema } from '@rssarti/pix-shared';

describe('provider-mock integration', () => {
  let port: number;
  let close: () => void;

  beforeAll(async () => {
    port = 3400 + Math.floor(Math.random() * 100);
    const app = await new Promise<ReturnType<typeof createMockServer>>((resolve) => {
      const instance = createMockServer();
      instance.server.listen(port, () => resolve(instance));
    });
    close = () => app.server.close();
  });

  afterAll(() => close());

  it('creates charge via mock-server', async () => {
    const pix = new PixSDK({ provider: new MockProvider({ baseUrl: `http://localhost:${port}` }) });
    const charge = await pix.createCharge({ amount: 42.5, description: 'Integration' });
    expect(charge.amount.amount).toBe(42.5);
    expect(charge.pixCopyPaste).toBeDefined();
  });

  it('contract: cob response matches bacen schema', async () => {
    const pix = new PixSDK({ provider: new MockProvider({ baseUrl: `http://localhost:${port}` }) });
    const charge = await pix.createCharge({ amount: 1 });
    const fetched = await pix.getCharge(charge.txid);
    bacenCobSchema.parse({
      txid: fetched.txid,
      status: 'ATIVA',
      valor: { original: fetched.amount.amount.toFixed(2) },
      pixCopiaECola: fetched.pixCopyPaste,
    });
  });
});
