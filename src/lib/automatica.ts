import { ambiente } from "@/lib/ambiente";
import { comSistema } from "@/lib/db";

/** Cobrança automática no cartão (preapproval do Mercado Pago) de uma clínica. */
export interface AutomaticaClinica {
  id: string;
  status: "pendente" | "ativa" | "pausada" | "cancelada" | string;
  planoCodigo: string;
  planoNome: string | null;
  ciclo: string;
  valor: string;
  cartaoFinal: string | null;
  proximaCobrancaEm: string | null;
  ultimaFalhaEm: string | null;
  ultimaFalhaMotivo: string | null;
  /** Reajuste agendado depois do aviso de 30 dias. */
  valorNovo: string | null;
  valorNovoEm: string | null;
  ativadaEm: string | null;
  canceladaEm: string | null;
  motivoCancelamento: string | null;
  criadoEm: string;
}

export const STATUS_AUTOMATICA: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: "Aguardando cartão", classe: "bg-amber-50 text-amber-800" },
  ativa: { texto: "Ativa", classe: "bg-emerald-50 text-emerald-800" },
  pausada: { texto: "Pausada", classe: "bg-amber-50 text-amber-800" },
  cancelada: { texto: "Cancelada", classe: "bg-paper text-muted" },
};

export const MOTIVO_CANCELAMENTO: Record<string, string> = {
  usuario: "pelo administrador da clínica",
  painel: "pelo painel interno",
  mercadopago: "pelo Mercado Pago",
  falhas: "depois de cobranças recusadas",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CAMPOS_DATA = [
  "proximaCobrancaEm",
  "ultimaFalhaEm",
  "valorNovoEm",
  "ativadaEm",
  "canceladaEm",
  "criadoEm",
] as const;

/** A assinatura em vigor (não cancelada); sem ela, a última cancelada, para mostrar o histórico. */
export async function buscarAutomatica(clinicaId: string): Promise<AutomaticaClinica | null> {
  if (!UUID.test(clinicaId)) return null;
  return comSistema(async (db) => {
    const resultado = await db.query<Record<string, unknown>>(
      `
      SELECT
        a.id,
        a.status,
        a."planoCodigo",
        pl.nome AS "planoNome",
        a.ciclo,
        a.valor::text AS valor,
        a."cartaoFinal",
        a."proximaCobrancaEm",
        a."ultimaFalhaEm",
        a."ultimaFalhaMotivo",
        a."valorNovo"::text AS "valorNovo",
        a."valorNovoEm",
        a."ativadaEm",
        a."canceladaEm",
        a."motivoCancelamento",
        a."criadoEm"
      FROM assinaturas_recorrentes a
      LEFT JOIN planos pl ON pl.codigo = a."planoCodigo"
      WHERE a."clinicaId" = $1::uuid
      ORDER BY (a.status <> 'cancelada') DESC, a."criadoEm" DESC
      LIMIT 1
      `,
      [clinicaId],
    );
    const linha = resultado.rows[0];
    if (!linha) return null;
    const convertida = { ...linha };
    for (const campo of CAMPOS_DATA) {
      const valor = linha[campo] as Date | string | null;
      convertida[campo] = valor ? new Date(valor).toISOString() : null;
    }
    return convertida as unknown as AutomaticaClinica;
  });
}

/** A API cancela no Mercado Pago e marca `motivoCancelamento = 'painel'`. */
export async function cancelarAutomaticaClinica(clinicaId: string): Promise<string> {
  if (!UUID.test(clinicaId)) throw new Error("Clínica inválida.");
  const { apiUrl, landingApiKey } = ambiente();
  const resposta = await fetch(
    `${apiUrl}/assinatura/clinicas/${encodeURIComponent(clinicaId)}/automatica/cancelar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Landing-Key": landingApiKey },
      cache: "no-store",
    },
  );
  const corpo = (await resposta.json().catch(() => null)) as { message?: string; mensagem?: string } | null;
  if (!resposta.ok) throw new Error(corpo?.message || "A API não conseguiu cancelar a cobrança automática.");
  return corpo?.mensagem || "Cobrança automática cancelada.";
}
