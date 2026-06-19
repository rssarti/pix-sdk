import {
  bacenCobSchema,
  bacenDevolucaoSchema,
  bacenRecSchema,
  generateE2eId,
  generateTxid,
  type BacenCob,
  type BacenDevolucao,
  type BacenPix,
  type BacenRec,
} from '@rssarti/pix-shared';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { createWooviStore, handleWooviRoute, type WooviStore } from './woovi.mock.js';

interface Store extends WooviStore {
  cobs: Map<string, BacenCob>;
  pix: Map<string, BacenPix>;
  devolucoes: Map<string, BacenDevolucao>;
  recs: Map<string, BacenRec>;
  schedules: Map<string, { idRec: string; amount: string; status: string }>;
}

function createStore(): Store {
  return {
    ...createWooviStore(),
    cobs: new Map(),
    pix: new Map(),
    devolucoes: new Map(),
    recs: new Map(),
    schedules: new Map(),
  };
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  return JSON.parse(text) as unknown;
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function mapRecStatus(status: string): BacenRec['status'] {
  const map: Record<string, BacenRec['status']> = {
    CRIADA: 'CRIADA',
    APROVADA: 'APROVADA',
    REJEITADA: 'REJEITADA',
    CANCELADA: 'CANCELADA',
  };
  return map[status] ?? 'CRIADA';
}

export function createMockServer(store = createStore()) {
  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const path = url.pathname;
    const method = req.method ?? 'GET';

    try {
      if (method === 'POST' && path === '/cob') {
        const body = (await readBody(req)) as Record<string, unknown>;
        const txid = generateTxid();
        const valor = (body.valor as { original?: string })?.original ?? '0.00';
        const cob: BacenCob = {
          txid,
          status: 'ATIVA',
          valor: { original: valor },
          chave: (body.chave as string) ?? '00000000000',
          pixCopiaECola: `00020126580014br.gov.bcb.pix0136${txid}5204000053039865802BR5913Mock PIX6009SAO PAULO62070503***6304ABCD`,
          calendario: {
            criacao: new Date().toISOString(),
            expiracao: (body.calendario as { expiracao?: number })?.expiracao ?? 3600,
          },
          solicitacaoPagador: body.solicitacaoPagador as string | undefined,
        };
        store.cobs.set(txid, cob);
        sendJson(res, 201, cob);
        return;
      }

      if (method === 'GET' && path.startsWith('/cob/')) {
        const txid = path.split('/')[2] ?? '';
        const cob = store.cobs.get(txid);
        if (!cob) {
          sendJson(res, 404, { type: 'https://pix.bcb.gov.br/api/v2/error/NaoEncontrado', title: 'Not found' });
          return;
        }
        sendJson(res, 200, cob);
        return;
      }

      if (method === 'PATCH' && path.startsWith('/cob/')) {
        const txid = path.split('/')[2] ?? '';
        const cob = store.cobs.get(txid);
        if (!cob) {
          sendJson(res, 404, { title: 'Not found' });
          return;
        }
        const body = (await readBody(req)) as Record<string, unknown>;
        if (body.status) cob.status = body.status as BacenCob['status'];
        store.cobs.set(txid, cob);
        sendJson(res, 200, cob);
        return;
      }

      if (method === 'GET' && path === '/pix') {
        sendJson(res, 200, { pix: Array.from(store.pix.values()) });
        return;
      }

      if (method === 'PUT' && path.match(/^\/pix\/[^/]+\/devolucao\/[^/]+$/)) {
        const parts = path.split('/');
        const e2eid = parts[2] ?? '';
        const id = parts[4] ?? '';
        const body = (await readBody(req)) as { valor?: string };
        const devolucao: BacenDevolucao = {
          id,
          valor: body.valor ?? '0.00',
          status: 'DEVOLVIDO',
          horario: { solicitacao: new Date().toISOString() },
        };
        store.devolucoes.set(`${e2eid}:${id}`, devolucao);
        sendJson(res, 200, devolucao);
        return;
      }

      if (method === 'POST' && path === '/rec') {
        const body = (await readBody(req)) as Record<string, unknown>;
        const idRec = generateTxid();
        const rec: BacenRec = {
          idRec,
          status: 'CRIADA',
          vinculo: body.vinculo as BacenRec['vinculo'],
          calendario: body.calendario as BacenRec['calendario'],
          valor: body.valor as BacenRec['valor'],
        };
        store.recs.set(idRec, rec);
        sendJson(res, 201, rec);
        return;
      }

      if (method === 'GET' && path.startsWith('/rec/')) {
        const idRec = path.split('/')[2] ?? '';
        const rec = store.recs.get(idRec);
        if (!rec) {
          sendJson(res, 404, { title: 'Not found' });
          return;
        }
        sendJson(res, 200, rec);
        return;
      }

      if (method === 'PATCH' && path.startsWith('/rec/')) {
        const idRec = path.split('/')[2] ?? '';
        const rec = store.recs.get(idRec);
        if (!rec) {
          sendJson(res, 404, { title: 'Not found' });
          return;
        }
        const body = (await readBody(req)) as { status?: string };
        if (body.status) rec.status = mapRecStatus(body.status);
        store.recs.set(idRec, rec);
        sendJson(res, 200, rec);
        return;
      }

      if (method === 'POST' && path === '/rec/solicrec') {
        const body = (await readBody(req)) as { idRec?: string };
        const idRec = body.idRec ?? '';
        const rec = store.recs.get(idRec);
        if (!rec) {
          sendJson(res, 404, { title: 'Not found' });
          return;
        }
        rec.status = 'APROVADA';
        store.recs.set(idRec, rec);
        sendJson(res, 200, { idSolicRec: generateTxid(), status: 'APROVADA', idRec });
        return;
      }

      if (method === 'POST' && path === '/cobr') {
        const body = (await readBody(req)) as { idRec?: string; valor?: string };
        const scheduleId = generateTxid();
        store.schedules.set(scheduleId, {
          idRec: body.idRec ?? '',
          amount: body.valor ?? '0.00',
          status: 'AGENDADA',
        });
        sendJson(res, 201, { idCobR: scheduleId, status: 'AGENDADA', ...body });
        return;
      }

      if (method === 'POST' && path === '/webhook/simulate') {
        const body = (await readBody(req)) as {
          type?: string;
          txid?: string;
          amount?: string;
        };
        const e2eid = generateE2eId();
        if (body.txid) {
          const cob = store.cobs.get(body.txid);
          if (cob) {
            cob.status = 'CONCLUIDA';
            store.cobs.set(body.txid, cob);
            store.pix.set(e2eid, {
              endToEndId: e2eid,
              txid: body.txid,
              valor: body.amount ?? cob.valor.original,
              horario: new Date().toISOString(),
            });
          }
        }
        sendJson(res, 200, {
          event: body.type ?? 'PIX_RECEBIDO',
          endToEndId: e2eid,
          txid: body.txid,
        });
        return;
      }

      if (method === 'GET' && path === '/health') {
        sendJson(res, 200, { status: 'ok' });
        return;
      }

      const handled = await handleWooviRoute(store, method, path, readBody, req, res, sendJson);
      if (handled) return;

      sendJson(res, 404, { title: 'Not found' });
    } catch (error) {
      sendJson(res, 500, {
        title: 'Internal error',
        detail: error instanceof Error ? error.message : 'Unknown',
      });
    }
  };

  const server = createServer((req, res) => {
    void handler(req, res);
  });

  return { server, store, handler };
}

export function startMockServer(port = 3333, store?: Store) {
  const app = createMockServer(store);
  return new Promise<ReturnType<typeof createMockServer>>((resolve, reject) => {
    app.server.once('error', reject);
    app.server.listen(port, () => {
      app.server.off('error', reject);
      resolve(app);
    });
  });
}

export { bacenCobSchema, bacenDevolucaoSchema, bacenRecSchema };
