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
  linhas: LinhaFinanceira[];
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
        c."situacaoCobranca"
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
    return resultado.rows;
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
    linhas,
  };
}
