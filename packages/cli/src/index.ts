import { Command } from 'commander';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { PixSDK, MockProvider, LoggingPlugin } from '@rssarti/pix-sdk';
import { startMockServer } from '@rssarti/pix-mock-server';

const program = new Command();
program.name('pix').description('PIX SDK CLI').version('0.0.1');

const charge = program.command('charge').description('Charge operations');

charge
  .command('create')
  .requiredOption('--amount <amount>', 'Amount in BRL')
  .option('--description <description>', 'Charge description')
  .option('--mock-url <url>', 'Mock server URL', 'http://localhost:3333')
  .action(async (opts: { amount: string; description?: string; mockUrl: string }) => {
    const pix = new PixSDK({
      provider: new MockProvider({ baseUrl: opts.mockUrl }),
      plugins: [new LoggingPlugin()],
    });
    const result = await pix.createCharge({
      amount: parseFloat(opts.amount),
      description: opts.description,
    });
    console.log(JSON.stringify(result, null, 2));
  });

charge
  .command('get')
  .requiredOption('--id <id>', 'Charge txid')
  .option('--mock-url <url>', 'Mock server URL', 'http://localhost:3333')
  .action(async (opts: { id: string; mockUrl: string }) => {
    const pix = new PixSDK({ provider: new MockProvider({ baseUrl: opts.mockUrl }) });
    const result = await pix.getCharge(opts.id);
    console.log(JSON.stringify(result, null, 2));
  });

const webhook = program.command('webhook').description('Webhook utilities');
webhook
  .command('listen')
  .option('--port <port>', 'Listen port', '4444')
  .option('--forward <url>', 'Forward URL')
  .action((opts: { port: string; forward?: string }) => {
    const port = parseInt(opts.port, 10);
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = Buffer.concat(chunks).toString('utf8');
      console.log(`Webhook received: ${body}`);
      if (opts.forward) {
        await fetch(opts.forward, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      }
      res.writeHead(200);
      res.end('ok');
    });
    server.listen(port, () => console.log(`Listening on port ${port}`));
  });

const mock = program.command('mock').description('Mock server');
mock
  .command('start')
  .option('--port <port>', 'Port', '3333')
  .action(async (opts: { port: string }) => {
    await startMockServer(parseInt(opts.port, 10));
    console.log(`Mock server on http://localhost:${opts.port}`);
  });

program.parse();
