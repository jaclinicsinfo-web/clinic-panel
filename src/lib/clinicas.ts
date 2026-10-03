import bcrypt from "bcryptjs";

import { ambiente } from "@/lib/ambiente";
import { comSistema } from "@/lib/db";

export interface Plano {
  codigo: string;
  nome: string;
  limiteUsuarios: number | null;
}

export interface ClinicaResumo {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  planoCodigo: string;
  planoNome: string;
  adminNome: string | null;
  adminEmail: string | null;
}

export interface AdministradorClinica {
  id: string;
  nome: string;
  email: string;
}

const PLANOS: Plano[] = [
  { codigo: "essencial", nome: "Essencial", limiteUsuarios: 5 },
  { codigo: "profissional", nome: "Profissional", limiteUsuarios: 20 },
  { codigo: "ilimitado", nome: "Ilimitado", limiteUsuarios: null },
];

export function catalogoPlanos() {
  return PLANOS;
}

export async function listarClinicas(): Promise<ClinicaResumo[]> {
  return comSistema(async (db) => {
    const resultado = await db.query<ClinicaResumo>(`
      SELECT
        c.id,
        c."nomeFantasia",
        c."razaoSocial",
        c.cnpj,
        c.email,
        p.codigo AS "planoCodigo",
        p.nome AS "planoNome",
        adm.nome AS "adminNome",
        adm.email AS "adminEmail"
      FROM clinicas c
      JOIN planos p ON p.id = c."planoId"
      LEFT JOIN LATERAL (
        SELECT u.nome, u.email
        FROM usuarios u
        JOIN perfis_acesso pa ON pa.id = u."perfilId"
        WHERE u."clinicaId" = c.id AND pa.nome = 'Administrador'
        ORDER BY u."criadoEm" ASC
        LIMIT 1
      ) adm ON true
      ORDER BY c."nomeFantasia" ASC
    `);
    return resultado.rows;
  });
}

export async function buscarClinica(id: string): Promise<ClinicaResumo | null> {
  const clinicas = await listarClinicas();
  return clinicas.find((item) => item.id === id) ?? null;
}

export async function definirPlano(clinicaId: string, codigo: string) {
  if (!PLANOS.some((plano) => plano.codigo === codigo)) {
    throw new Error("Plano inválido.");
  }

  await comSistema(async (db) => {
    const atualizado = await db.query(
      `
      UPDATE clinicas
      SET "planoId" = (SELECT id FROM planos WHERE codigo = $2 AND ativo = true),
          "atualizadoEm" = now()
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM planos WHERE codigo = $2 AND ativo = true)
      `,
      [clinicaId, codigo],
    );
    if (atualizado.rowCount !== 1) throw new Error("Não foi possível trocar o plano.");
  });
}

export async function definirLoginInicial(clinicaId: string, email: string, senha: string) {
  const emailNormalizado = email.trim().toLowerCase();
  if (!emailNormalizado.includes("@")) throw new Error("E-mail do administrador inválido.");
  if (senha.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");

  const hash = await bcrypt.hash(senha, 10);

  await comSistema(async (db) => {
    const admin = await db.query<{ id: string }>(
      `
      SELECT u.id
      FROM usuarios u
      JOIN perfis_acesso pa ON pa.id = u."perfilId"
      WHERE u."clinicaId" = $1 AND pa.nome = 'Administrador'
      ORDER BY u."criadoEm" ASC
      LIMIT 1
      `,
      [clinicaId],
    );
    const id = admin.rows[0]?.id;
    if (!id) throw new Error("Esta clínica ainda não tem administrador.");

    const ocupado = await db.query(
      `SELECT id FROM usuarios WHERE email = $1 AND id <> $2`,
      [emailNormalizado, id],
    );
    if (ocupado.rowCount) throw new Error("Já existe uma conta com este e-mail.");

    await db.query(
      `
      UPDATE usuarios
      SET email = $2, "senhaHash" = $3, "atualizadoEm" = now()
      WHERE id = $1 AND "clinicaId" = $4
      `,
      [id, emailNormalizado, hash, clinicaId],
    );
  });
}

export async function abrirClinica(dados: {
  plano: string;
  clinica: {
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    telefone: string;
    email: string;
  };
  unidade: { nome: string; cidade: string };
  usuario: { nome: string; email: string; senha: string };
}) {
  const { apiUrl, landingApiKey } = ambiente();
  const resposta = await fetch(`${apiUrl}/cadastro`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Landing-Key": landingApiKey,
    },
    body: JSON.stringify(dados),
    cache: "no-store",
  });

  const corpo = (await resposta.json().catch(() => null)) as { message?: string } | null;
  if (!resposta.ok) {
    throw new Error(corpo?.message || "A API não conseguiu abrir a clínica.");
  }
}
