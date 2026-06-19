import request from 'supertest';
import { startMockServer } from '../src/server.js';

describe('startMockServer', () => {
  it('listens on a free port', async () => {
    const app = await startMockServer(0);
    await request(app.server).get('/health').expect(200);
    await new Promise<void>((resolve) => app.server.close(() => resolve()));
  });
});
