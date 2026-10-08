"use client";

import { useState } from "react";

import { mascararDinheiro } from "@/lib/dinheiro";

export function CampoDinheiro({
  nome,
  rotulo,
  valor,
}: {
  nome: string;
  rotulo: string;
  valor: string;
}) {
  const [texto, setTexto] = useState(() => mascararDinheiro(String(Math.round(Number(valor || 0) * 100))));

  return (
    <label className="block text-sm">
      <span className="font-medium">{rotulo}</span>
      <span className="mt-1 flex overflow-hidden rounded-lg border border-line focus-within:border-brand">
        <span className="bg-paper px-3 py-2 text-muted">R$</span>
        <input
          name={nome}
          inputMode="numeric"
          autoComplete="off"
          required
          value={texto}
          placeholder="0,00"
          aria-label={rotulo}
          onChange={(evento) => setTexto(mascararDinheiro(evento.target.value))}
          className="w-full bg-white px-3 py-2 outline-none"
        />
      </span>
    </label>
  );
}
