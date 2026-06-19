import { EfiProvider } from '@rssarti/pix-provider-efi';
import { PixSDK, LoggingPlugin } from '@rssarti/pix-sdk';

async function main() {
  const mockUrl = process.env.PIX_MOCK_URL ?? 'http://localhost:3333';
  console.log(`Using mock server: ${mockUrl}`);

  const pix = new PixSDK({
    provider: new EfiProvider({ mode: 'mock', mockBaseUrl: mockUrl }),
    plugins: [new LoggingPlugin()],
  });

  const charge = await pix.createCharge({ amount: 100, description: 'Pedido #123' });
  console.log('Charge created:', charge.txid, charge.pixCopyPaste?.slice(0, 40) + '...');

  const fetched = await pix.getCharge(charge.txid);
  console.log('Charge status:', fetched.status);

  const auth = await pix.automatic.createAuthorization({
    contractId: 'contract-001',
    debtorDocument: '12345678901',
    amount: 49.9,
    periodicity: 'MONTHLY',
  });
  console.log('Automatic authorization:', auth.id, auth.status);

  const schedule = await pix.automatic.schedule({ authorizationId: auth.id, amount: 49.9 });
  console.log('Scheduled:', schedule.id, schedule.status);

  await pix.automatic.cancel({ authorizationId: auth.id });
  console.log('Authorization cancelled');

  const event = await pix.webhooks.parse(
    { type: 'PIX_PAID', txid: charge.txid, eventId: 'evt-demo' },
    {},
  );
  console.log('Webhook event:', event.type, event.transactionId);
}

main().catch(console.error);
