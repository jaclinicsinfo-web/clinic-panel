import { comSistema } from "@/lib/db";
import { lerValorMensal } from "@/lib/clinicas";

export interface PrecoPlano {
  codigo: string;
  nome: string;
  limiteUsuarios: number | null;
  precoMensal: string;
  precoAnual: string;
}

const CODIGOS = ["essencial", "profissional", "ilimitado"] as const;

export async function listarPrecosPlanos(): Promise<PrecoPlano[]> {
  return comSistema(async (db) => {
    const resultado = await db.query<PrecoPlano>(`
      SELECT
        codigo,
        nome,
        "limiteUsuarios",
        "precoMensal"::text AS "precoMensal",
        "precoAnual"::text AS "precoAnual"
      FROM planos
      WHERE ativo = true
      ORDER BY CASE codigo
        WHEN 'essencial' THEN 1
        WHEN 'profissional' THEN 2
        ELSE 3
      END
    `);
    return resultado.rows;
  });
}

export async function definirPrecosPlanos(precos: Record<string, { mensal: string; anual: string }>) {
  const valores = CODIGOS.map((codigo) => {
    const mensalidade = lerValorMensal(precos[codigo]?.mensal ?? "");
    const anual = lerValorMensal(precos[codigo]?.anual ?? "");
    if (Number(mensalidade) <= 0 || Number(anual) <= 0) {
      throw new Error("O preço mensal e o anual de cada plano precisam ser maiores que zero.");
    }
    return { codigo, mensalidade, anual };
  });

  await comSistema(async (db) => {
    for (const item of valores) {
      const atualizado = await db.query(
        `
        UPDATE planos
        SET "precoMensal" = $2, "precoAnual" = $3, "atualizadoEm" = now()
        WHERE codigo = $1 AND ativo = true
        `,
        [item.codigo, item.mensalidade, item.anual],
      );
      if (atualizado.rowCount !== 1) {
        throw new Error("Não foi possível atualizar o preço do plano.");
      }
    }
  });
}
