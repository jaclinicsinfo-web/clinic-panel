"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";

import { ambiente } from "@/lib/ambiente";
import { gravarSessao, lerSessao, limparSessao } from "@/lib/sessao";

function igual(a: string, b: string) {
  const esquerda = Buffer.from(a);
  const direita = Buffer.from(b);
  if (esquerda.length !== direita.length) return false;
  return timingSafeEqual(esquerda, direita);
}

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const { panelEmail, panelPassword } = ambiente();

  if (!igual(email, panelEmail) || !igual(senha, panelPassword)) {
    redirect("/login?erro=1");
  }

  await gravarSessao();
  redirect("/");
}

export async function sair() {
  await limparSessao();
  redirect("/login");
}

export async function destinoSeLogado() {
  if (await lerSessao()) redirect("/");
}
