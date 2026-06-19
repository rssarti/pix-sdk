import request from 'supertest';
import { createMockServer, bacenCobSchema } from '../src/server.js';

describe('mock-server', () => {
  const { server } = createMockServer();

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it('POST /cob creates charge', async () => {
    const res = await request(server)
      .post('/cob')
      .send({ valor: { original: '10.00' }, chave: 'test@email.com' })
      .expect(201);
    const parsed = bacenCobSchema.parse(res.body);
    expect(parsed.txid).toBeDefined();
    expect(parsed.status).toBe('ATIVA');
    expect(parsed.pixCopiaECola).toBeDefined();
  });

  it('GET /cob/:txid retrieves charge', async () => {
    const created = await request(server).post('/cob').send({ valor: { original: '5.00' } });
    const txid = created.body.txid as string;
    const res = await request(server).get(`/cob/${txid}`).expect(200);
    expect(res.body.txid).toBe(txid);
  });

  it('GET /cob/:txid returns 404 when missing', async () => {
    await request(server).get('/cob/missing').expect(404);
  });

  it('PATCH /cob/:txid updates charge', async () => {
    const created = await request(server).post('/cob').send({ valor: { original: '5.00' } });
    const txid = created.body.txid as string;
    const res = await request(server)
      .patch(`/cob/${txid}`)
      .send({ status: 'CONCLUIDA' })
      .expect(200);
    expect(res.body.status).toBe('CONCLUIDA');
  });

  it('PATCH /cob/:txid returns 404 when missing', async () => {
    await request(server).patch('/cob/missing').send({ status: 'CONCLUIDA' }).expect(404);
  });

  it('POST /rec and GET /rec/:id', async () => {
    const created = await request(server)
      .post('/rec')
      .send({ vinculo: { contrato: 'c1' }, valor: { valorRec: '100.00' } })
      .expect(201);
    const idRec = created.body.idRec as string;
    const res = await request(server).get(`/rec/${idRec}`).expect(200);
    expect(res.body.status).toBe('CRIADA');
  });

  it('GET /rec/:id returns 404 when missing', async () => {
    await request(server).get('/rec/missing').expect(404);
  });

  it('PATCH /rec/:id updates status', async () => {
    const created = await request(server).post('/rec').send({ vinculo: { contrato: 'c1' } }).expect(201);
    const idRec = created.body.idRec as string;
    const res = await request(server).patch(`/rec/${idRec}`).send({ status: 'CANCELADA' }).expect(200);
    expect(res.body.status).toBe('CANCELADA');
  });

  it('PATCH /rec/:id returns 404 when missing', async () => {
    await request(server).patch('/rec/missing').send({ status: 'CANCELADA' }).expect(404);
  });

  it('PATCH /rec maps unknown status to CRIADA', async () => {
    const created = await request(server).post('/rec').send({ vinculo: { contrato: 'c1' } }).expect(201);
    const idRec = created.body.idRec as string;
    const res = await request(server).patch(`/rec/${idRec}`).send({ status: 'FOO' }).expect(200);
    expect(res.body.status).toBe('CRIADA');
  });

  it('POST /rec/solicrec approves rec', async () => {
    const created = await request(server).post('/rec').send({ vinculo: { contrato: 'c1' } }).expect(201);
    const idRec = created.body.idRec as string;
    const res = await request(server).post('/rec/solicrec').send({ idRec }).expect(200);
    expect(res.body.status).toBe('APROVADA');
  });

  it('POST /rec/solicrec returns 404 when missing', async () => {
    await request(server).post('/rec/solicrec').send({ idRec: 'missing' }).expect(404);
  });

  it('POST /cobr schedules charge', async () => {
    const res = await request(server).post('/cobr').send({ idRec: 'r1', valor: '15.00' }).expect(201);
    expect(res.body.status).toBe('AGENDADA');
  });

  it('POST /webhook/simulate marks charge paid', async () => {
    const created = await request(server).post('/cob').send({ valor: { original: '20.00' } });
    const txid = created.body.txid as string;
    await request(server).post('/webhook/simulate').send({ txid, type: 'PIX_RECEBIDO' }).expect(200);
    const res = await request(server).get(`/cob/${txid}`).expect(200);
    expect(res.body.status).toBe('CONCLUIDA');
  });

  it('GET /pix lists received pix', async () => {
    const created = await request(server).post('/cob').send({ valor: { original: '20.00' } });
    const txid = created.body.txid as string;
    await request(server).post('/webhook/simulate').send({ txid }).expect(200);
    const res = await request(server).get('/pix').expect(200);
    expect(res.body.pix.length).toBeGreaterThan(0);
  });

  it('PUT devolucao refunds pix', async () => {
    const res = await request(server)
      .put('/pix/e2e123/devolucao/ref1')
      .send({ valor: '10.00' })
      .expect(200);
    expect(res.body.status).toBe('DEVOLVIDO');
  });

  it('GET /health', async () => {
    await request(server).get('/health').expect(200);
  });

  it('returns 404 for unknown routes', async () => {
    await request(server).get('/unknown').expect(404);
  });

  it('returns 500 on invalid json', async () => {
    await request(server)
      .post('/cob')
      .set('Content-Type', 'application/json')
      .send('{ invalid')
      .expect(500);
  });
});
