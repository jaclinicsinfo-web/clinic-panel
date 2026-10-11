"use client";

import { cancelarAutomatica } from "@/app/(painel)/acoes";

export function CancelarAutomatica({ clinicaId }: { clinicaId: string }) {
  return (
    <form
      action={cancelarAutomatica}
      onSubmit={(evento) => {
        if (
          !confirm(
            "Cancelar a cobrança automática desta clínica no Mercado Pago? O período já pago continua valendo; a próxima renovação volta a ser manual.",
          )
        ) {
          evento.preventDefault();
        }
      }}
    >
      <input type="hidden" name="clinicaId" value={clinicaId} />
      <button
        type="submit"
        className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-danger hover:bg-rose-50"
      >
        Cancelar automática
      </button>
    </form>
  );
}
