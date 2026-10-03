"use client";

import { ativarClinica, desativarClinica, excluirClinica } from "@/app/(painel)/acoes";

export function AcoesClinica({ id, ativa }: { id: string; ativa: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={ativa ? desativarClinica : ativarClinica}>
        <input type="hidden" name="clinicaId" value={id} />
        <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:border-brand">
          {ativa ? "Desativar" : "Ativar"}
        </button>
      </form>
      <form
        action={excluirClinica}
        onSubmit={(evento) => {
          if (!confirm("Excluir esta clínica e todos os usuários? O login vai dizer que o usuário não existe.")) {
            evento.preventDefault();
          }
        }}
      >
        <input type="hidden" name="clinicaId" value={id} />
        <button type="submit" className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-danger hover:bg-rose-50">
          Excluir
        </button>
      </form>
    </div>
  );
}
