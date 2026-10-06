"use server";

import { redirect } from "next/navigation";

import {
  abrirClinica,
  definirCobranca,
  definirConta,
  definirLoginInicial,
  definirPlano,
  definirStatusClinica,
  excluirClinica as apagarClinica,
} from "@/lib/clinicas";
import { exigirSessao } from "@/lib/sessao";

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

function bruto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "");
}

export type EstadoNovaClinica = {
  id: number;
  erro?: string;
  valores: {
    plano: string;
    adminNome: string;
    adminEmail: string;
    adminSenha: string;
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    telefone: string;
    emailClinica: string;
    unidadeNome: string;
    unidadeCidade: string;
  };
};

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export async function criarClinica(estado: EstadoNovaClinica, formData: FormData): Promise<EstadoNovaClinica> {
  await exigirSessao();
  const valores = {
    plano: bruto(formData, "plano"),
    adminNome: bruto(formData, "adminNome"),
    adminEmail: bruto(formData, "adminEmail"),
    adminSenha: bruto(formData, "adminSenha"),
    nomeFantasia: bruto(formData, "nomeFantasia"),
    razaoSocial: bruto(formData, "razaoSocial"),
    cnpj: bruto(formData, "cnpj"),
    telefone: bruto(formData, "telefone"),
    emailClinica: bruto(formData, "emailClinica"),
    unidadeNome: bruto(formData, "unidadeNome"),
    unidadeCidade: bruto(formData, "unidadeCidade"),
  };
  try {
    await abrirClinica({
      plano: texto(formData, "plano"),
      clinica: {
        nomeFantasia: texto(formData, "nomeFantasia"),
        razaoSocial: texto(formData, "razaoSocial"),
        cnpj: digitos(texto(formData, "cnpj")),
        telefone: digitos(texto(formData, "telefone")),
        email: texto(formData, "emailClinica").toLowerCase(),
      },
      unidade: {
        nome: texto(formData, "unidadeNome"),
        cidade: texto(formData, "unidadeCidade"),
      },
      usuario: {
        nome: texto(formData, "adminNome"),
        email: texto(formData, "adminEmail").toLowerCase(),
        senha: texto(formData, "adminSenha"),
      },
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível abrir a clínica.";
    return { id: estado.id + 1, erro: mensagem, valores };
  }
  redirect("/clinicas?ok=criada");
}

export async function salvarPlano(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  const naLista = texto(formData, "origem") === "lista";
  try {
    await definirPlano(id, texto(formData, "plano"));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível trocar o plano.";
    redirect(
      naLista
        ? `/clinicas?erro=${encodeURIComponent(mensagem)}`
        : `/clinicas/${id}?erro=${encodeURIComponent(mensagem)}`,
    );
  }
  redirect(naLista ? "/clinicas?ok=plano" : `/clinicas/${id}?ok=plano`);
}

export async function salvarLogin(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await definirLoginInicial(id, texto(formData, "email"), texto(formData, "senha"));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível atualizar o login.";
    redirect(`/clinicas/${id}?erro=${encodeURIComponent(mensagem)}`);
  }
  redirect(`/clinicas/${id}?ok=login`);
}

function voltarClinicas(ok: string) {
  redirect(`/clinicas?ok=${ok}`);
}

export async function desativarClinica(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await definirStatusClinica(id, "desativada");
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível desativar a clínica.";
    redirect(`/clinicas?erro=${encodeURIComponent(mensagem)}`);
  }
  voltarClinicas("desativada");
}

export async function ativarClinica(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await definirStatusClinica(id, "ativa");
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível ativar a clínica.";
    redirect(`/clinicas?erro=${encodeURIComponent(mensagem)}`);
  }
  voltarClinicas("ativada");
}

export async function excluirClinica(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await apagarClinica(id);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível excluir a clínica.";
    redirect(`/clinicas?erro=${encodeURIComponent(mensagem)}`);
  }
  voltarClinicas("excluida");
}

export async function salvarConta(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await definirConta(id, texto(formData, "plano"), texto(formData, "valor"), texto(formData, "situacao"));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível atualizar a clínica.";
    redirect(`/clinicas?erro=${encodeURIComponent(mensagem)}`);
  }
  voltarClinicas("conta");
}

export async function salvarCobranca(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await definirCobranca(id, texto(formData, "valor"), texto(formData, "situacao"));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível salvar a cobrança.";
    redirect(`/clinicas?erro=${encodeURIComponent(mensagem)}`);
  }
  voltarClinicas("cobranca");
}
