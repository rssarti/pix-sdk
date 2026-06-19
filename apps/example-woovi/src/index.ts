import { WooviProvider } from '@rssarti/pix-provider-woovi';
import { PixSDK, LoggingPlugin } from '@rssarti/pix-sdk';

async function main() {
  const mode = (process.env.WOOVI_MODE ?? 'mock') as 'mock' | 'sandbox' | 'production';
  const mockUrl = process.env.WOOVI_MOCK_URL ?? process.env.PIX_MOCK_URL ?? 'http://localhost:3333';

  console.log(`Woovi mode: ${mode}`);
  if (mode !== 'mock' && !process.env.WOOVI_APP_ID) {
    throw new Error('Defina WOOVI_APP_ID para sandbox/production');
  }

  const pix = new PixSDK({
    provider: new WooviProvider({
      mode,
      mockBaseUrl: mockUrl,
      appId: process.env.WOOVI_APP_ID,
    }),
    plugins: [new LoggingPlugin()],
  });

  const charge = await pix.createCharge({
    amount: 10,
    description: 'Teste Woovi SDK',
    expirationSeconds: 3600,
  });

  console.log('Cobrança criada');
  console.log('  correlationID:', charge.id);
  console.log('  txid:', charge.txid);
  console.log('  status:', charge.status);
  console.log('  brCode:', charge.pixCopyPaste?.slice(0, 60) + '...');

  const fetched = await pix.getCharge(charge.id);
  console.log('Consulta:', fetched.status, 'R$', fetched.amount.amount);

  if (mode === 'mock') {
    const auth = await pix.automatic.createAuthorization({
      contractId: 'contract-woovi-001',
      debtorDocument: '12345678901',
      debtorName: 'Cliente Teste',
      amount: 49.9,
      periodicity: 'MONTHLY',
    });
    console.log('Assinatura:', auth.id, auth.status);

    const schedule = await pix.automatic.schedule({ authorizationId: auth.id, amount: 49.9 });
    console.log('Agendamento mock:', schedule.id, schedule.status);

    await pix.automatic.cancel({ authorizationId: auth.id });
    console.log('Assinatura cancelada');
  }

  const event = await pix.webhooks.parse(
    {
      event: 'OPENPIX:CHARGE_COMPLETED',
      charge: {
        correlationID: charge.id,
        transactionID: charge.txid,
        status: 'COMPLETED',
        value: 1000,
        paidAt: new Date().toISOString(),
      },
      pix: { endToEndId: 'E123', transactionID: charge.txid, value: 1000, time: new Date().toISOString() },
    },
    {},
  );
  console.log('Webhook parseado:', event.type, event.transactionId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
