import { comSistema } from "@/lib/db";

export interface EventoPagamento {
  id: string;
  criadoEm: string;
  tipo: string;
  nivel: "info" | "aviso" | "erro" | string;
  mensagem: string;
  pedidoId: string | null;
  clinicaId: string | null;
  clinicaNome: string | null;
  pagamentoId: string | null;
  meio: string | null;
  status: string | null;
  valor: string | null;
  detalhes: Record<string, unknown> | null;
}

export interface FiltroEventos {
  nivel?: string;
  tipo?: string;
  meio?: string;
  /** Pedido, pagamento do Mercado Pago, clínica ou texto da mensagem. */
  busca?: string;
  limite?: number;
}

export const TIPOS_EVENTO: Record<string, string> = {
  checkout_criado: "Checkout aberto",
  checkout_recusado: "Checkout recusado pelo MP",
  aviso_recebido: "Aviso do MP recebido",
  aviso_recusado: "Aviso do MP recusado",
  aviso_falhou: "Aviso do MP falhou",
  pagamento_consultado: "Pagamento consultado",
  pagamento_ignorado: "Pagamento sem efeito",
  pedido_pago: "Pedido pago",
  pedido_revisao: "Pedido em revisão",
  pedido_estornado: "Estorno",
  acesso_enviado: "Acesso enviado",
  acesso_falhou: "Acesso não enviado",
  acesso_reenviado: "Acesso reenviado",
  email_enviado: "E-mail enviado",
  email_tentativa_falhou: "E-mail falhou (nova tentativa)",
  email_desistiu: "E-mail não enviado (desistiu)",
  lembrete_enfileirado: "Lembrete de cobrança",
  conciliacao_aplicou: "Aplicado pela conferência",
  pedido_expirado: "Checkout expirado",
  pedido_revisao_pendente: "Revisão pendente",
  troca_agendada: "Troca de plano agendada",
  troca_agendada_cancelada: "Troca agendada cancelada",
  troca_aplicada: "Troca de plano aplicada",
  troca_nao_aplicada: "Troca agendada não aplicada",
  automatica_criada: "Automática: aguardando cartão",
  automatica_ativada: "Automática ativada",
  automatica_cancelada: "Automática cancelada",
  automatica_atualizada: "Automática atualizada",
  cobranca_automatica_aprovada: "Cobrança automática aprovada",
  cobranca_automatica_recusada: "Cobrança automática recusada",
  reajuste_agendado: "Reajuste agendado (automática)",
};

export const MEIOS: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listarEventos(filtro: FiltroEventos = {}): Promise<EventoPagamento[]> {
  const condicoes: string[] = [];
  const valores: unknown[] = [];
  const param = (valor: unknown) => {
    valores.push(valor);
    return `$${valores.length}`;
  };

  if (filtro.nivel) condicoes.push(`e.nivel = ${param(filtro.nivel)}`);
  if (filtro.tipo) condicoes.push(`e.tipo = ${param(filtro.tipo)}`);
  if (filtro.meio) condicoes.push(`e.meio = ${param(filtro.meio)}`);
  const busca = filtro.busca?.trim();
  if (busca) {
    if (UUID.test(busca)) {
      const p = param(busca);
      condicoes.push(`(e."pedidoId" = ${p}::uuid OR COALESCE(e."clinicaId", ped."clinicaId") = ${p}::uuid)`);
    } else {
      const p = param(`%${busca}%`);
      condicoes.push(
        `(e."pagamentoId" ILIKE ${p} OR e.mensagem ILIKE ${p} OR c."nomeFantasia" ILIKE ${p} OR ped.dados->'clinica'->>'nomeFantasia' ILIKE ${p})`,
      );
    }
  }

  const limite = Math.min(Math.max(filtro.limite ?? 200, 1), 500);
  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  return comSistema(async (db) => {
    const resultado = await db.query<EventoPagamento & { criadoEm: Date }>(
      `
      SELECT
        e.id, e."criadoEm", e.tipo, e.nivel, e.mensagem, e."pedidoId", e."pagamentoId",
        e.meio, e.status, e.valor::text AS valor, e.detalhes,
        COALESCE(e."clinicaId", ped."clinicaId") AS "clinicaId",
        COALESCE(c."nomeFantasia", ped.dados->'clinica'->>'nomeFantasia') AS "clinicaNome"
      FROM eventos_pagamento e
      LEFT JOIN pedidos_assinatura ped ON ped.id = e."pedidoId"
      LEFT JOIN clinicas c ON c.id = COALESCE(e."clinicaId", ped."clinicaId")
      ${where}
      ORDER BY e."criadoEm" DESC
      LIMIT ${limite}
      `,
      valores,
    );
    return resultado.rows.map((linha) => ({ ...linha, criadoEm: new Date(linha.criadoEm).toISOString() }));
  });
}

export interface ResumoEventos {
  pagos: number;
  valorPago: string;
  pixAguardando: number;
  avisosRecusados: number;
  erros: number;
  emailsFalha: number;
  conferencia: number;
  lembretes: number;
  filaPendente: number;
  filaDesistiu: number;
}

/** Últimas 24 horas. */
export async function resumoEventos(): Promise<ResumoEventos> {
  return comSistema(async (db) => {
    const resultado = await db.query<ResumoEventos>(`
      SELECT
        count(*) FILTER (WHERE tipo = 'pedido_pago')::int AS pagos,
        COALESCE(sum(valor) FILTER (WHERE tipo = 'pedido_pago'), 0)::text AS "valorPago",
        count(DISTINCT "pagamentoId") FILTER (
          WHERE tipo = 'pagamento_ignorado' AND meio = 'pix' AND status = 'pending'
        )::int AS "pixAguardando",
        count(*) FILTER (WHERE tipo = 'aviso_recusado')::int AS "avisosRecusados",
        count(*) FILTER (WHERE nivel = 'erro')::int AS erros,
        count(*) FILTER (WHERE tipo IN ('email_tentativa_falhou', 'email_desistiu'))::int AS "emailsFalha",
        count(*) FILTER (WHERE tipo = 'conciliacao_aplicou')::int AS conferencia,
        count(*) FILTER (WHERE tipo = 'lembrete_enfileirado')::int AS lembretes
      FROM eventos_pagamento
      WHERE "criadoEm" > now() - interval '24 hours'
    `);
    const fila = await db.query<{ pendentes: number; desistiu: number }>(`
      SELECT
        count(*) FILTER (WHERE status IN ('pendente', 'enviando'))::int AS pendentes,
        count(*) FILTER (WHERE status = 'falhou' AND "atualizadoEm" > now() - interval '7 days')::int AS desistiu
      FROM emails_saida
    `);
    return {
      ...resultado.rows[0],
      filaPendente: fila.rows[0]?.pendentes ?? 0,
      filaDesistiu: fila.rows[0]?.desistiu ?? 0,
    };
  });
}
