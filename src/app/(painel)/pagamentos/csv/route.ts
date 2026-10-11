import { lerSessao } from "@/lib/sessao";
import {
  dataBR,
  descricaoPagamento,
  lerFiltroPagamentos,
  listarPagamentos,
  rotuloCiclo,
  rotuloMeio,
  STATUS_PAGAMENTO,
  type Pagamento,
} from "@/lib/pagamentos";

export const dynamic = "force-dynamic";

/** Tudo o que cabe numa exportação para a contabilidade. */
const LIMITE_CSV = 50000;

/** Texto: aspas quando precisa e proteção contra fórmula no Excel (=, +, -, @ no início). */
function texto(valor: string | number | null | undefined) {
  let conteudo = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(conteudo)) conteudo = `'${conteudo}`;
  return /[;"\r\n]/.test(conteudo) ? `"${conteudo.replace(/"/g, '""')}"` : conteudo;
}

/** Número longo (id do Mercado Pago) como texto, para o Excel não virar notação científica. */
function codigo(valor: string | null) {
  if (!valor) return "";
  return /^\d+$/.test(valor) ? `"=""${valor}"""` : texto(valor);
}

function cnpj(valor: string | null) {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (digitos.length !== 14) return texto(valor);
  return texto(digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"));
}

/** Dinheiro com vírgula decimal e sem separador de milhar (o Excel em pt-BR lê como número). */
function dinheiro(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "";
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2).replace(".", ",") : "";
}

const CABECALHO = [
  "Data",
  "Clínica",
  "Razão social",
  "CNPJ",
  "Descrição",
  "Plano",
  "Ciclo",
  "Período início",
  "Período fim",
  "Meio",
  "Parcelas",
  "Valor",
  "Total pago pelo cliente",
  "Status",
  "Devolvido em",
  "Recibo nº",
  "Pagamento MP",
  "Pedido",
];

function linha(pagamento: Pagamento) {
  return [
    texto(dataBR(pagamento.pagoEm)),
    texto(pagamento.clinicaNome),
    texto(pagamento.razaoSocial),
    cnpj(pagamento.cnpj),
    texto(descricaoPagamento(pagamento)),
    texto(pagamento.planoNome ?? pagamento.planoCodigo),
    texto(rotuloCiclo(pagamento.ciclo)),
    texto(dataBR(pagamento.periodoInicio)),
    texto(dataBR(pagamento.periodoFim)),
    texto(rotuloMeio(pagamento.meio, null)),
    texto(pagamento.parcelas),
    dinheiro(pagamento.valor),
    dinheiro(pagamento.totalPago),
    texto(STATUS_PAGAMENTO[pagamento.status] ?? pagamento.status),
    texto(dataBR(pagamento.estornadoEm)),
    texto(pagamento.numeroRecibo),
    codigo(pagamento.pagamentoId),
    texto(pagamento.id),
  ].join(";");
}

export async function GET(request: Request) {
  if (!(await lerSessao())) {
    return new Response("Sessão expirada. Entre no painel de novo.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const url = new URL(request.url);
  const filtro = lerFiltroPagamentos(Object.fromEntries(url.searchParams));
  const { pagamentos } = await listarPagamentos({ ...filtro, limite: LIMITE_CSV });

  const corpo = "﻿" + [CABECALHO.map(texto).join(";"), ...pagamentos.map(linha)].join("\r\n") + "\r\n";
  const nome = `pagamentos-${filtro.de || "inicio"}-${filtro.ate || "hoje"}.csv`;

  return new Response(corpo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
