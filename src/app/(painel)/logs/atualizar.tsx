"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Recarrega a lista de eventos a cada 10 segundos enquanto marcado. */
export function AtualizarSozinho() {
  const router = useRouter();
  const [ligado, setLigado] = useState(true);

  useEffect(() => {
    if (!ligado) return;
    const timer = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [ligado, router]);

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <input type="checkbox" checked={ligado} onChange={(evento) => setLigado(evento.target.checked)} />
      Atualizar a cada 10 s
    </label>
  );
}
