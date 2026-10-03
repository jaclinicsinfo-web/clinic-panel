"use server";

import { redirect } from "next/navigation";

import { abrirClinica, definirLoginInicial, definirPlano } from "@/lib/clinicas";
import { exigirSessao } from "@/lib/sessao";

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export async function criarClinica(formData: FormData) {
  await exigirSessao();
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
    redirect(`/clinicas/nova?erro=${encodeURIComponent(mensagem)}`);
  }
  redirect("/clinicas?ok=criada");
}

export async function salvarPlano(formData: FormData) {
  await exigirSessao();
  const id = texto(formData, "clinicaId");
  try {
    await definirPlano(id, texto(formData, "plano"));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível trocar o plano.";
    redirect(`/clinicas/${id}?erro=${encodeURIComponent(mensagem)}`);
  }
  redirect(`/clinicas/${id}?ok=plano`);
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
