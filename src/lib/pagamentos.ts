import { comSistema } from "@/lib/db";
import { reais } from "@/lib/dinheiro";
import { MEIOS } from "@/lib/logs";

const FUSO = "America/Sao_Paulo";

/** Pedido de assinatura que virou dinheiro: pago ou pago e devolvido. Pendentes nunca aparecem. */
export interface Pagamento {
  id: string;
  status: "pago" | "estornado" | string;
  tipo: string;
  planoCodigo: string;
  planoNome: string | null;
  planoAnteriorNome: string | null;
  ciclo: string;
  /** Troca de plano: ciclo de antes (diferente do atual = troca de ciclo com crédito). */
  cicloAnterior: string | null;
  credito: string | null;
  valor: string;
  /** Com juros do parcelamento, quando houver. */
  totalPago: string | null;
  meio: string | null;
  parcelas: number | null;
  pagoEm: string | null;
  estornadoEm: string | null;
  periodoInicio: string | null;
  periodoFim: string | null;
  numeroRecibo: number | null;
  pagamentoId: string | null;
  clinicaId: string | null;
  clinicaNome: string;
  razaoSocial: string | null;
  cnpj: string | null;
}

export interface FiltroPagamentos {
  /** YYYY-MM-DD, dia no fuso de São Paulo, sobre "pagoEm". */
  de?: string;
  ate?: string;
  meio?: string;
  status?: string;
  plano?: string;
  clinicaId?: string;
  limite?: number;
}

export interface TotaisPagamentos {
  quantidade: number;
  /** Tudo o que entrou no período: pagos + devolvidos. */
  recebido: number;
  /** Valor dos pagamentos devolvidos (estornados). */
  devolvido: number;
  /** O que ficou: só os pagos. */
  liquido: number;
}

export const STATUS_PAGAMENTO: Record<string, string> = {
  pago: "Pago",
  estornado: "Devolvido",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dataValida(valor: string | undefined): valor is string {
  if (!valor) return false;
  const partes = DATA.exec(valor);
  if (!partes) return false;
  const [, ano, mes, dia] = partes.map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** Primeiro e último dia do mês corrente em São Paulo (YYYY-MM-DD). */
export function mesAtual(referencia = new Date()) {
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referencia);
  const [ano, mes] = hoje.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const mm = String(mes).padStart(2, "0");
  return { de: `${ano}-${mm}-01`, ate: `${ano}-${mm}-${String(ultimo).padStart(2, "0")}` };
}

/**
 * Lê os filtros da URL (página e CSV usam a mesma regra).
 * Sem `de` e sem `ate` na URL: mês corrente. Campo enviado vazio: sem limite daquele lado.
 */
export function lerFiltroPagamentos(params: Record<string, string | string[] | undefined>): Required<
  Pick<FiltroPagamentos, "de" | "ate" | "meio" | "status" | "plano">
> {
  const ler = (campo: string) => {
    const valor = params[campo];
    return (Array.isArray(valor) ? valor[0] : valor)?.trim();
  };
  const de = ler("de");
  const ate = ler("ate");
  const padrao = de === undefined && ate === undefined ? mesAtual() : null;
  const status = ler("status") ?? "";
  const meio = ler("meio") ?? "";
  const plano = ler("plano") ?? "";
  return {
    de: padrao ? padrao.de : dataValida(de) ? de : "",
    ate: padrao ? padrao.ate : dataValida(ate) ? ate : "",
    meio: /^[a-z_]{1,40}$/.test(meio) ? meio : "",
    status: Object.hasOwn(STATUS_PAGAMENTO, status) ? status : "",
    plano: /^[a-z0-9_-]{1,40}$/.test(plano) ? plano : "",
  };
}

function montarFiltro(filtro: FiltroPagamentos) {
  const condicoes: string[] = [`p.status IN ('pago', 'estornado')`];
  const valores: unknown[] = [];
  const param = (valor: unknown) => {
    valores.push(valor);
    return `$${valores.length}`;
  };

  if (dataValida(filtro.de)) {
    // Pedido pago antes de existir "pagoEm": vale a última atualização (a mesma regra da numeração dos recibos).
    condicoes.push(`COALESCE(p."pagoEm", p."atualizadoEm") >= (${param(filtro.de)}::date)::timestamp AT TIME ZONE '${FUSO}'`);
  }
  if (dataValida(filtro.ate)) {
    condicoes.push(`COALESCE(p."pagoEm", p."atualizadoEm") < (${param(filtro.ate)}::date + 1)::timestamp AT TIME ZONE '${FUSO}'`);
  }
  if (filtro.meio) condicoes.push(`p.meio = ${param(filtro.meio)}`);
  if (filtro.status && Object.hasOwn(STATUS_PAGAMENTO, filtro.status)) condicoes.push(`p.status = ${param(filtro.status)}`);
  if (filtro.plano) condicoes.push(`p."planoCodigo" = ${param(filtro.plano)}`);
  if (filtro.clinicaId !== undefined) {
    // Id inválido não pode virar "todas as clínicas".
    condicoes.push(UUID.test(filtro.clinicaId) ? `p."clinicaId" = ${param(filtro.clinicaId)}::uuid` : "false");
  }

  return { where: `WHERE ${condicoes.join(" AND ")}`, valores };
}

type LinhaPagamento = Omit<Pagamento, "pagoEm" | "estornadoEm" | "periodoInicio" | "periodoFim"> & {
  pagoEm: Date | string | null;
  estornadoEm: Date | string | null;
  periodoInicio: Date | string | null;
  periodoFim: Date | string | null;
};

const iso = (valor: Date | string | null) => (valor ? new Date(valor).toISOString() : null);

export async function listarPagamentos(
  filtro: FiltroPagamentos = {},
): Promise<{ pagamentos: Pagamento[]; totais: TotaisPagamentos }> {
  const { where, valores } = montarFiltro(filtro);
  const limite = Math.min(Math.max(Math.trunc(filtro.limite ?? 1000), 1), 50000);

  return comSistema(async (db) => {
    const linhas = await db.query<LinhaPagamento>(
      `
      SELECT
        p.id,
        p.status,
        p.tipo,
        p."planoCodigo",
        pl.nome AS "planoNome",
        pla.nome AS "planoAnteriorNome",
        p.ciclo,
        p."cicloAnterior",
        p.credito::text AS credito,
        p.valor::text AS valor,
        p."totalPago"::text AS "totalPago",
        p.meio,
        p.parcelas,
        p."pagoEm",
        p."estornadoEm",
        p."periodoInicio",
        p."periodoFim",
        p."numeroRecibo",
        p."pagamentoId",
        p."clinicaId",
        COALESCE(c."nomeFantasia", p.dados->'clinica'->>'nomeFantasia', 'Clínica sem nome') AS "clinicaNome",
        COALESCE(c."razaoSocial", p.dados->'clinica'->>'razaoSocial') AS "razaoSocial",
        COALESCE(c.cnpj, p.dados->'clinica'->>'cnpj') AS cnpj
      FROM pedidos_assinatura p
      LEFT JOIN clinicas c ON c.id = p."clinicaId"
      LEFT JOIN planos pl ON pl.codigo = p."planoCodigo"
      LEFT JOIN planos pla ON pla.codigo = p."planoAnteriorCodigo"
      ${where}
      ORDER BY p."pagoEm" DESC NULLS LAST, p."criadoEm" DESC
      LIMIT ${limite}
      `,
      valores,
    );

    const soma = await db.query<{ quantidade: number; pago: string; estornado: string }>(
      `
      SELECT
        count(*)::int AS quantidade,
        COALESCE(sum(p.valor) FILTER (WHERE p.status = 'pago'), 0)::text AS pago,
        COALESCE(sum(p.valor) FILTER (WHERE p.status = 'estornado'), 0)::text AS estornado
      FROM pedidos_assinatura p
      ${where}
      `,
      valores,
    );

    const pago = Number(soma.rows[0]?.pago ?? 0);
    const estornado = Number(soma.rows[0]?.estornado ?? 0);

    return {
      pagamentos: linhas.rows.map((linha) => ({
        ...linha,
        pagoEm: iso(linha.pagoEm),
        estornadoEm: iso(linha.estornadoEm),
        periodoInicio: iso(linha.periodoInicio),
        periodoFim: iso(linha.periodoFim),
      })),
      totais: {
        quantidade: soma.rows[0]?.quantidade ?? 0,
        recebido: pago + estornado,
        devolvido: estornado,
        liquido: pago,
      },
    };
  });
}

/** dd/mm/aaaa no fuso de São Paulo. */
export function dataBR(valor: string | null) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: FUSO }).format(new Date(valor));
}

/** dd/mm no fuso de São Paulo. */
export function diaMesBR(valor: string | null) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: FUSO }).format(new Date(valor));
}

export function rotuloCiclo(ciclo: string | null) {
  return ciclo === "anual" ? "Anual" : "Mensal";
}

export function descricaoPagamento(
  pagamento: Pick<Pagamento, "tipo" | "planoNome" | "planoCodigo" | "ciclo" | "cicloAnterior" | "credito">,
) {
  const plano = pagamento.planoNome ?? pagamento.planoCodigo;
  if (pagamento.tipo === "troca_plano") {
    if (pagamento.cicloAnterior && pagamento.cicloAnterior !== pagamento.ciclo) {
      const credito = Number(pagamento.credito ?? 0);
      return `Troca para ${plano} · ${rotuloCiclo(pagamento.ciclo)}${credito > 0 ? ` (crédito de ${reais(credito)})` : ""}`;
    }
    return `Troca para ${plano} (proporcional)`;
  }
  if (pagamento.tipo === "recorrente") return "Cobrança automática";
  return `Plano ${pagamento.planoNome ?? pagamento.planoCodigo} · ${rotuloCiclo(pagamento.ciclo)}`;
}

/** Linha de apoio da descrição: plano/ciclo (troca e automática) e período coberto. */
export function detalhePagamento(pagamento: Pagamento) {
  const partes: string[] = [];
  const plano = pagamento.planoNome ?? pagamento.planoCodigo;
  if (pagamento.tipo === "troca_plano") {
    partes.push(
      pagamento.planoAnteriorNome ? `${pagamento.planoAnteriorNome} → ${plano}` : `Para ${plano}`,
      rotuloCiclo(pagamento.ciclo),
    );
  } else if (pagamento.tipo === "recorrente") {
    partes.push(plano, rotuloCiclo(pagamento.ciclo));
  }
  if (pagamento.periodoInicio && pagamento.periodoFim) {
    partes.push(`${dataBR(pagamento.periodoInicio)} a ${dataBR(pagamento.periodoFim)}`);
  }
  return partes.join(" · ");
}

export function rotuloMeio(meio: string | null, parcelas: number | null) {
  if (!meio) return "";
  const nome = Object.hasOwn(MEIOS, meio) ? MEIOS[meio] : meio;
  return parcelas && parcelas > 1 ? `${nome} · ${parcelas}x` : nome;
}

export function rotuloStatusPagamento(pagamento: Pick<Pagamento, "status" | "estornadoEm">) {
  if (pagamento.status === "estornado") {
    return pagamento.estornadoEm ? `Devolvido em ${diaMesBR(pagamento.estornadoEm)}` : "Devolvido";
  }
  return Object.hasOwn(STATUS_PAGAMENTO, pagamento.status) ? STATUS_PAGAMENTO[pagamento.status] : pagamento.status;
}
