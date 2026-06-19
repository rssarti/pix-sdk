import type { BacenCob, BacenDevolucao, BacenRec } from '@rssarti/pix-shared';
import type { AutomaticAuthorization, AutomaticSchedule, Charge, ChargeStatus, Refund } from '@rssarti/pix-core';

const statusMap: Record<string, ChargeStatus> = {
  ATIVA: 'ACTIVE',
  CONCLUIDA: 'COMPLETED',
  REMOVIDA_PELO_USUARIO_RECEBEDOR: 'REMOVED',
  REMOVIDA_PELO_PSP: 'REMOVED',
};

export function mapBacenCobToCharge(cob: BacenCob): Charge {
  return {
    id: cob.txid,
    txid: cob.txid,
    status: statusMap[cob.status] ?? 'ACTIVE',
    amount: { amount: parseFloat(cob.valor.original), currency: 'BRL' },
    description: cob.solicitacaoPagador,
    pixCopyPaste: cob.pixCopiaECola,
    qrCode: cob.pixCopiaECola,
    createdAt: new Date(cob.calendario?.criacao ?? Date.now()),
    expiresAt: cob.calendario?.expiracao
      ? new Date(Date.now() + cob.calendario.expiracao * 1000)
      : undefined,
  };
}

export function mapChargeToBacenCob(input: {
  amount: number;
  description?: string;
  pixKey?: string;
  expirationSeconds?: number;
}): Record<string, unknown> {
  return {
    calendario: { expiracao: input.expirationSeconds ?? 3600 },
    valor: { original: input.amount.toFixed(2) },
    chave: input.pixKey ?? '00000000000',
    solicitacaoPagador: input.description,
  };
}

export function mapBacenDevolucaoToRefund(e2eid: string, dev: BacenDevolucao): Refund {
  const statusMap: Record<string, Refund['status']> = {
    EM_PROCESSAMENTO: 'PROCESSING',
    DEVOLVIDO: 'COMPLETED',
    NAO_REALIZADO: 'FAILED',
  };
  return {
    id: dev.id,
    transactionId: e2eid,
    amount: { amount: parseFloat(dev.valor), currency: 'BRL' },
    status: statusMap[dev.status] ?? 'PROCESSING',
    createdAt: new Date(dev.horario?.solicitacao ?? Date.now()),
  };
}

const recStatusMap: Record<string, AutomaticAuthorization['status']> = {
  CRIADA: 'CREATED',
  APROVADA: 'APPROVED',
  REJEITADA: 'REJECTED',
  CANCELADA: 'CANCELLED',
};

const periodicityMap: Record<string, AutomaticAuthorization['periodicity']> = {
  SEMANAL: 'WEEKLY',
  MENSAL: 'MONTHLY',
  TRIMESTRAL: 'QUARTERLY',
  SEMESTRAL: 'SEMIANNUAL',
  ANUAL: 'ANNUAL',
};

export function mapBacenRecToAuthorization(rec: BacenRec): AutomaticAuthorization {
  return {
    id: rec.idRec,
    status: recStatusMap[rec.status] ?? 'CREATED',
    contractId: rec.vinculo?.contrato,
    debtorDocument: rec.vinculo?.devedor?.cpf ?? rec.vinculo?.devedor?.cnpj,
    debtorName: rec.vinculo?.devedor?.nome,
    amount: rec.valor?.valorRec
      ? { amount: parseFloat(rec.valor.valorRec), currency: 'BRL' }
      : undefined,
    periodicity: rec.calendario?.periodicidade
      ? periodicityMap[rec.calendario.periodicidade]
      : undefined,
    createdAt: new Date(),
  };
}

export function mapScheduleResponse(
  id: string,
  authorizationId: string,
  amount: number,
): AutomaticSchedule {
  return {
    id,
    authorizationId,
    amount: { amount, currency: 'BRL' },
    scheduledAt: new Date(),
    status: 'SCHEDULED',
  };
}
