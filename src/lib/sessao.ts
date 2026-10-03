import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ambiente } from "@/lib/ambiente";

const COOKIE = "clinic_panel_sessao";
const DOZE_HORAS = 12 * 60 * 60 * 1000;

function assinar(corpo: string) {
  return createHmac("sha256", ambiente().panelSecret).update(corpo).digest("base64url");
}

export function tokenDaSessao() {
  const expira = Date.now() + DOZE_HORAS;
  const corpo = String(expira);
  return `${corpo}.${assinar(corpo)}`;
}

export function tokenValido(token: string | undefined) {
  if (!token) return false;
  const ponto = token.lastIndexOf(".");
  if (ponto <= 0) return false;
  const corpo = token.slice(0, ponto);
  const mac = token.slice(ponto + 1);
  const esperado = assinar(corpo);
  const a = Buffer.from(mac);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(corpo) > Date.now();
}

export async function lerSessao() {
  const jar = await cookies();
  return tokenValido(jar.get(COOKIE)?.value);
}

export async function exigirSessao() {
  if (!(await lerSessao())) redirect("/login");
}

export async function gravarSessao() {
  const jar = await cookies();
  jar.set(COOKIE, tokenDaSessao(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DOZE_HORAS / 1000,
  });
}

export async function limparSessao() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export { COOKIE };
