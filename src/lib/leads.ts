import { ambiente } from "@/lib/ambiente";
import { comSistema } from "@/lib/db";

export interface Lead {
  id: string;
  status: string;
  planoCodigo: string;
  ciclo: string;
  valor: string;
  nomeFantasia: string;
  email: string;
  criadoEm: string;
}

interface DadosLead {
  ciclo?: string;
  clinica?: { nomeFantasia?: string; email?: string };
  usuario?: { email?: string };
}

interface LinhaLead {
  id: string;
  status: string;
  planoCodigo: string;
  valor: string;
  dados: DadosLead | string | null;
  criadoEm: Date | string;
}

function lerDados(valor: string): DadosLead | null {
  try {
    return JSON.parse(valor) as DadosLead;
  } catch {
    return null;
  }
}

export async function listarLeads(): Promise<Lead[]> {
  return comSistema(async (db) => {
    const resultado = await db.query<LinhaLead>(`
      SELECT id, status, "planoCodigo", valor::text AS valor, dados, "criadoEm"
      FROM pedidos_assinatura
      WHERE tipo = 'nova_clinica' AND status IN ('pendente', 'processando', 'revisao')
      ORDER BY "criadoEm" DESC
    `);

    return resultado.rows.map((linha) => {
      const dados = typeof linha.dados === "string" ? lerDados(linha.dados) : linha.dados;
      return {
        id: linha.id,
        status: linha.status,
        planoCodigo: linha.planoCodigo,
        ciclo: dados?.ciclo === "anual" ? "anual" : "mensal",
        valor: linha.valor,
        nomeFantasia: dados?.clinica?.nomeFantasia?.trim() || "Clínica sem nome",
        email: dados?.usuario?.email || dados?.clinica?.email || "",
        criadoEm: new Date(linha.criadoEm).toISOString(),
      };
    });
  });
}

export interface AcessoPendente {
  id: string;
  nomeFantasia: string;
  email: string;
  pagoEm: string;
}

/** Pedido pago cuja clínica abriu, mas o e-mail com a senha não saiu e o administrador nunca entrou. */
export async function listarAcessosPendentes(): Promise<AcessoPendente[]> {
  return comSistema(async (db) => {
    const resultado = await db.query<{
      id: string;
      dados: DadosLead | string | null;
      pagoEm: Date | string;
      adminEmail: string | null;
    }>(`
      SELECT p.id, p.dados, p."pagoEm", adm.email AS "adminEmail"
      FROM pedidos_assinatura p
      JOIN LATERAL (
        SELECT u.email, u."ultimoAcesso"
        FROM usuarios u
        JOIN perfis_acesso pa ON pa.id = u."perfilId"
        WHERE u."clinicaId" = p."clinicaId" AND pa.nome = 'Administrador'
        ORDER BY u."criadoEm" ASC
        LIMIT 1
      ) adm ON true
      WHERE p.tipo = 'nova_clinica'
        AND p.status = 'pago'
        AND p."pagoEm" IS NOT NULL
        AND p."acessoEnviadoEm" IS NULL
        AND adm."ultimoAcesso" IS NULL
      ORDER BY p."pagoEm" DESC
    `);

    return resultado.rows.map((linha) => {
      const dados = typeof linha.dados === "string" ? lerDados(linha.dados) : linha.dados;
      return {
        id: linha.id,
        nomeFantasia: dados?.clinica?.nomeFantasia?.trim() || "Clínica sem nome",
        email: linha.adminEmail || dados?.usuario?.email || "",
        pagoEm: new Date(linha.pagoEm).toISOString(),
      };
    });
  });
}

/** A API gera outra senha temporária e manda o e-mail de acesso. */
export async function reenviarAcessoPedido(pedidoId: string): Promise<string> {
  const { apiUrl, landingApiKey } = ambiente();
  const resposta = await fetch(`${apiUrl}/assinatura/pedidos/${encodeURIComponent(pedidoId)}/reenviar-acesso`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Landing-Key": landingApiKey },
    cache: "no-store",
  });
  const corpo = (await resposta.json().catch(() => null)) as { message?: string; mensagem?: string } | null;
  if (!resposta.ok) throw new Error(corpo?.message || "A API não conseguiu reenviar o acesso.");
  return corpo?.mensagem || "Acesso reenviado.";
}
