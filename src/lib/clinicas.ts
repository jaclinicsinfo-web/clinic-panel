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
  status: string;
  valorMensal: string;
  situacaoCobranca: string;
  tipoAcesso: string;
  cicloCobranca: string;
  trialExpiraEm: string | null;
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
        adm.email AS "adminEmail",
        c.status,
        c."valorMensal"::text AS "valorMensal",
        c."situacaoCobranca",
        c."tipoAcesso",
        c."cicloCobranca",
        c."trialExpiraEm"
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
    return resultado.rows.map((clinica) => ({
      ...clinica,
      trialExpiraEm: clinica.trialExpiraEm ? new Date(clinica.trialExpiraEm).toISOString() : null,
    }));
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

const SITUACOES = ["em_dia", "pendente", "atrasada"] as const;

export async function definirStatusClinica(clinicaId: string, status: "ativa" | "desativada") {
  await comSistema(async (db) => {
    const atualizado = await db.query(
      `UPDATE clinicas SET status = $2, "atualizadoEm" = now() WHERE id = $1`,
      [clinicaId, status],
    );
    if (atualizado.rowCount !== 1) throw new Error("Clínica não encontrada.");
  });
}

export function lerValorMensal(valor: string) {
  const limpo = valor.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const numero = Number(normalizado);
  if (!limpo || !Number.isFinite(numero) || numero < 0 || numero > 999999.99) {
    throw new Error("Informe a mensalidade entre 0 e 999.999,99.");
  }
  return numero.toFixed(2);
}

export async function definirConta(clinicaId: string, codigo: string, situacao: string) {
  if (!PLANOS.some((plano) => plano.codigo === codigo)) {
    throw new Error("Plano inválido.");
  }
  if (!SITUACOES.includes(situacao as (typeof SITUACOES)[number])) {
    throw new Error("Situação da cobrança inválida.");
  }

  await comSistema(async (db) => {
    const atualizado = await db.query(
      `
      UPDATE clinicas
      SET "planoId" = (SELECT id FROM planos WHERE codigo = $2 AND ativo = true),
          "situacaoCobranca" = $3,
          "tipoAcesso" = 'pago',
          "trialExpiraEm" = NULL,
          "atualizadoEm" = now()
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM planos WHERE codigo = $2 AND ativo = true)
      `,
      [clinicaId, codigo, situacao],
    );
    if (atualizado.rowCount !== 1) throw new Error("Não foi possível atualizar a clínica.");
  });
}

export async function definirCobranca(clinicaId: string, valor: string, situacao: string) {
  if (!SITUACOES.includes(situacao as (typeof SITUACOES)[number])) {
    throw new Error("Situação da cobrança inválida.");
  }
  const mensalidade = lerValorMensal(valor);

  await comSistema(async (db) => {
    const atualizado = await db.query(
      `
      UPDATE clinicas
      SET "valorMensal" = $2, "situacaoCobranca" = $3, "atualizadoEm" = now()
      WHERE id = $1
      `,
      [clinicaId, mensalidade, situacao],
    );
    if (atualizado.rowCount !== 1) throw new Error("Clínica não encontrada.");
  });
}

const APAGAR_CLINICA = [
  `DELETE FROM envios_lembrete WHERE "clinicaId" = $1`,
  `DELETE FROM custos_envio WHERE "clinicaId" = $1`,
  `DELETE FROM regras_lembrete WHERE "clinicaId" = $1`,
  `DELETE FROM templates_mensagem WHERE "clinicaId" = $1`,
  `DELETE FROM integracoes_clinica WHERE "clinicaId" = $1`,
  `DELETE FROM holerites WHERE "clinicaId" = $1`,
  `DELETE FROM registros_ponto WHERE "clinicaId" = $1`,
  `DELETE FROM notificacoes WHERE "clinicaId" = $1`,
  `DELETE FROM recuperacoes_senha WHERE "usuarioId" IN (SELECT id FROM usuarios WHERE "clinicaId" = $1)`,
  `DELETE FROM movimentacoes_estoque WHERE "clinicaId" = $1`,
  `DELETE FROM produtos_estoque WHERE "clinicaId" = $1`,
  `DELETE FROM comissoes WHERE "clinicaId" = $1`,
  `DELETE FROM lote_guias WHERE "loteId" IN (SELECT id FROM lotes_convenio WHERE "clinicaId" = $1)`,
  `DELETE FROM parcelas_cobranca WHERE "cobrancaId" IN (SELECT id FROM cobrancas WHERE "clinicaId" = $1)`,
  `DELETE FROM cobrancas WHERE "clinicaId" = $1`,
  `DELETE FROM lotes_convenio WHERE "clinicaId" = $1`,
  `DELETE FROM despesas WHERE "clinicaId" = $1`,
  `DELETE FROM formas_pagamento WHERE "clinicaId" = $1`,
  `DELETE FROM documentos_paciente WHERE "clinicaId" = $1`,
  `DELETE FROM logs_acesso_prontuario WHERE "clinicaId" = $1`,
  `DELETE FROM atendimentos WHERE "clinicaId" = $1`,
  `DELETE FROM acompanhamentos_clinicos WHERE "clinicaId" = $1`,
  `DELETE FROM lista_espera WHERE "clinicaId" = $1`,
  `DELETE FROM bloqueios_agenda WHERE "clinicaId" = $1`,
  `DELETE FROM agendamentos WHERE "clinicaId" = $1`,
  `DELETE FROM pacientes WHERE "clinicaId" = $1`,
  `DELETE FROM profissional_horarios WHERE "profissionalId" IN (SELECT id FROM profissionais WHERE "clinicaId" = $1)`,
  `DELETE FROM profissional_procedimentos WHERE "profissionalId" IN (SELECT id FROM profissionais WHERE "clinicaId" = $1)`,
  `DELETE FROM profissionais WHERE "clinicaId" = $1`,
  `DELETE FROM convenio_procedimentos WHERE "convenioId" IN (SELECT id FROM convenios WHERE "clinicaId" = $1)`,
  `DELETE FROM convenios WHERE "clinicaId" = $1`,
  `DELETE FROM procedimentos WHERE "clinicaId" = $1`,
  `DELETE FROM usuarios_unidades WHERE "usuarioId" IN (SELECT id FROM usuarios WHERE "clinicaId" = $1)`,
  `DELETE FROM usuarios WHERE "clinicaId" = $1`,
  `DELETE FROM perfis_acesso WHERE "clinicaId" = $1`,
  `DELETE FROM unidades WHERE "clinicaId" = $1`,
  `DELETE FROM clinicas WHERE id = $1`,
];

export async function excluirClinica(clinicaId: string) {
  await comSistema(async (db) => {
    let apagouClinica = 0;
    for (const sql of APAGAR_CLINICA) {
      const resultado = await db.query(sql, [clinicaId]);
      if (sql.startsWith("DELETE FROM clinicas")) apagouClinica = resultado.rowCount ?? 0;
    }
    if (apagouClinica !== 1) throw new Error("Clínica não encontrada.");
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
