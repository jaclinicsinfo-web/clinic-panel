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
      WHERE status <> 'pago'
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
