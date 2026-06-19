#!/usr/bin/env node
import { startMockServer } from './server.js';

const port = Number(process.env.PORT ?? 3333);
startMockServer(port).then(() => {
  console.log(`PIX mock server listening on http://localhost:${port}`);
});
