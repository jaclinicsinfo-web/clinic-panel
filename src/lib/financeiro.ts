import { comSistema } from "@/lib/db";
import { periodoDoMes } from "@/lib/dinheiro";

export interface LinhaFinanceira {
  id: string;
  nomeFantasia: string;
  planoNome: string;
  recebido: string;
  aReceber: string;
  despesasPagas: string;
  aPagar: string;
  valorMensal: string;
  situacaoCobranca: string;
  tipoAcesso: string;
  trialExpiraEm: string | null;
}

export interface ResumoFinanceiro {
  rotulo: string;
  recebido: number;
  aReceber: number;
  despesasPagas: number;
  aPagar: number;
  resultado: number;
  mensalidades: number;
  mensalidadesEmDia: number;
  mensalidadesEmAberto: number;
  /** Pedidos de assinatura pagos pelo Mercado Pago no mês (não conta os devolvidos). */
  assinaturasRecebidas: number;
  assinaturasPagamentos: number;
  linhas: LinhaFinanceira[];
}

/** Soma dos pedidos de assinatura pagos no período (dias no fuso de São Paulo). */
async function assinaturasPagasNoPeriodo(inicio: string, fim: string) {
  return comSistema(async (db) => {
    const resultado = await db.query<{ quantidade: number; total: string }>(
      `
      SELECT count(*)::int AS quantidade, COALESCE(sum(valor), 0)::text AS total
      FROM pedidos_assinatura
      WHERE status = 'pago'
        AND "pagoEm" >= ($1::date)::timestamp AT TIME ZONE 'America/Sao_Paulo'
        AND "pagoEm" < ($2::date)::timestamp AT TIME ZONE 'America/Sao_Paulo'
      `,
      [inicio, fim],
    );
    return {
      quantidade: resultado.rows[0]?.quantidade ?? 0,
      total: Number(resultado.rows[0]?.total ?? 0),
    };
  });
}

export async function resumoFinanceiro(): Promise<ResumoFinanceiro> {
  const periodo = periodoDoMes();

  const linhas = await comSistema(async (db) => {
    const resultado = await db.query<LinhaFinanceira>(
      `
      SELECT
        c.id,
        c."nomeFantasia",
        p.nome AS "planoNome",
        COALESCE(r.recebido, 0)::text AS recebido,
        COALESCE(r.a_receber, 0)::text AS "aReceber",
        COALESCE(d.pagas, 0)::text AS "despesasPagas",
        COALESCE(d.a_pagar, 0)::text AS "aPagar",
        c."valorMensal"::text AS "valorMensal",
        c."situacaoCobranca",
        c."tipoAcesso",
        c."trialExpiraEm"
      FROM clinicas c
      JOIN planos p ON p.id = c."planoId"
      LEFT JOIN (
        SELECT
          "clinicaId",
          SUM(valor) FILTER (
            WHERE status = 'pago' AND "pagoEm" >= $1::date AND "pagoEm" < $2::date
          ) AS recebido,
          SUM(valor) FILTER (WHERE status = 'pendente') AS a_receber
        FROM cobrancas
        GROUP BY "clinicaId"
      ) r ON r."clinicaId" = c.id
      LEFT JOIN (
        SELECT
          "clinicaId",
          SUM(valor) FILTER (
            WHERE status = 'pago' AND "pagoEm" >= $1::date AND "pagoEm" < $2::date
          ) AS pagas,
          SUM(valor) FILTER (WHERE status = 'a_pagar') AS a_pagar
        FROM despesas
        GROUP BY "clinicaId"
      ) d ON d."clinicaId" = c.id
      ORDER BY c."nomeFantasia" ASC
      `,
      [periodo.inicio, periodo.fim],
    );
    return resultado.rows.map((linha) => ({
      ...linha,
      trialExpiraEm: linha.trialExpiraEm ? new Date(linha.trialExpiraEm).toISOString() : null,
    }));
  });

  const somar = (campo: keyof Pick<LinhaFinanceira, "recebido" | "aReceber" | "despesasPagas" | "aPagar">) =>
    linhas.reduce((total, linha) => total + Number(linha[campo] || 0), 0);

  const recebido = somar("recebido");
  const despesasPagas = somar("despesasPagas");
  const mensalidadesEmDia = linhas.reduce(
    (total, linha) => total + (linha.situacaoCobranca === "em_dia" ? Number(linha.valorMensal) || 0 : 0),
    0,
  );
  const mensalidades = linhas.reduce((total, linha) => total + (Number(linha.valorMensal) || 0), 0);
  const { quantidade: assinaturasPagamentos, total: assinaturasRecebidas } = await assinaturasPagasNoPeriodo(
    periodo.inicio,
    periodo.fim,
  );

  return {
    rotulo: periodo.rotulo,
    recebido,
    aReceber: somar("aReceber"),
    despesasPagas,
    aPagar: somar("aPagar"),
    resultado: recebido - despesasPagas,
    mensalidades,
    mensalidadesEmDia,
    mensalidadesEmAberto: mensalidades - mensalidadesEmDia,
    assinaturasRecebidas,
    assinaturasPagamentos,
    linhas,
  };
}
