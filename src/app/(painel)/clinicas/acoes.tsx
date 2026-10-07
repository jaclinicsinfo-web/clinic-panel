"use client";

import * as React from "react";

import { ativarClinica, desativarClinica, excluirClinica, salvarConta } from "@/app/(painel)/acoes";
import type { Plano } from "@/lib/clinicas";

const situacoes = [
  { valor: "em_dia", rotulo: "Em dia" },
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "atrasada", rotulo: "Atrasada" },
];

const detalhePlano: Record<string, string> = {
  essencial: "Até 5 usuários e 1 unidade",
  profissional: "Até 20 usuários e unidades ilimitadas",
  ilimitado: "Usuários e unidades sem teto",
};

export interface ClinicaAcao {
  id: string;
  nomeFantasia: string;
  planoCodigo: string;
  valorMensal: string;
  situacaoCobranca: string;
  status: string;
  tipoAcesso: string;
}

function mensalidadeCampo(valor: string) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

export function AcoesClinica({ clinica, planos }: { clinica: ClinicaAcao; planos: Plano[] }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const ativa = clinica.status !== "desativada";

  function abrir() {
    dialogRef.current?.showModal();
  }

  function fechar() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand"
      >
        Ações
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100%-2rem)] w-[min(100%-2rem,34rem)] overflow-y-auto rounded-2xl border border-line bg-card p-0 text-ink shadow-xl backdrop:bg-ink/45"
        onClick={(evento) => {
          if (evento.target === dialogRef.current) fechar();
        }}
      >
        <form action={salvarConta}>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Conta</p>
              <h2 className="mt-1 text-lg font-semibold">{clinica.nomeFantasia}</h2>
              <p className="mt-1 text-sm text-muted">
                {clinica.tipoAcesso === "gratuito"
                  ? "Salvar transforma o acesso gratuito em assinatura paga."
                  : "Altere o plano e a mensalidade. O plano entra no próximo login."}
              </p>
            </div>
            <button type="button" onClick={fechar} className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-paper" aria-label="Fechar">
              Fechar
            </button>
          </div>

          <div className="space-y-5 px-5 py-4">
            <input type="hidden" name="clinicaId" value={clinica.id} />

            <fieldset>
              <legend className="text-sm font-medium">Plano</legend>
              <div className="mt-2 grid gap-2">
                {planos.map((plano) => (
                  <label
                    key={plano.codigo}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-3 py-3 has-[:checked]:border-brand has-[:checked]:bg-teal-50"
                  >
                    <input
                      type="radio"
                      name="plano"
                      value={plano.codigo}
                      defaultChecked={plano.codigo === clinica.planoCodigo}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">{plano.nome}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {detalhePlano[plano.codigo] ?? "Plano da clínica"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Mensalidade</span>
                <span className="mt-1 flex overflow-hidden rounded-lg border border-line focus-within:border-brand">
                  <span className="bg-paper px-3 py-2 text-muted">R$</span>
                  <input
                    name="valor"
                    inputMode="decimal"
                    defaultValue={mensalidadeCampo(clinica.valorMensal)}
                    aria-label={`Mensalidade de ${clinica.nomeFantasia}`}
                    className="w-full bg-white px-3 py-2 outline-none"
                  />
                </span>
              </label>

              <fieldset>
                <legend className="text-sm font-medium">Situação</legend>
                <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg border border-line p-1">
                  {situacoes.map((item) => (
                    <label key={item.valor} className="cursor-pointer">
                      <input
                        type="radio"
                        name="situacao"
                        value={item.valor}
                        defaultChecked={item.valor === clinica.situacaoCobranca}
                        className="peer sr-only"
                      />
                      <span className="block rounded-md px-2 py-2 text-center text-xs font-medium text-muted peer-checked:bg-ink peer-checked:text-white">
                        {item.rotulo}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
            <button type="button" onClick={fechar} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-paper">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong">
              Salvar alterações
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-5 py-3">
          <p className="text-xs text-muted">Acesso da clínica</p>
          <div className="flex gap-2">
            <form action={ativa ? desativarClinica : ativarClinica}>
              <input type="hidden" name="clinicaId" value={clinica.id} />
              <button type="submit" className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium hover:border-brand">
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
              <input type="hidden" name="clinicaId" value={clinica.id} />
              <button type="submit" className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-danger hover:bg-rose-50">
                Excluir
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
