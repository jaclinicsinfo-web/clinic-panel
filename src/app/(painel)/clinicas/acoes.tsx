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
  situacaoCobranca: string;
  status: string;
  tipoAcesso: string;
}

export function AcoesClinica({ clinica, planos }: { clinica: ClinicaAcao; planos: Plano[] }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const ativa = clinica.status !== "desativada";
  const formId = `conta-${clinica.id}`;

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
        className="m-auto max-h-[calc(100%-2rem)] w-[min(100%-2rem,32rem)] overflow-y-auto rounded-2xl border border-line bg-card p-0 text-ink shadow-xl backdrop:bg-ink/45"
        onClick={(evento) => {
          if (evento.target === dialogRef.current) fechar();
        }}
      >
        <form id={formId} action={salvarConta}>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Conta</p>
              <h2 className="mt-1 text-lg font-semibold">{clinica.nomeFantasia}</h2>
              <p className="mt-1 text-sm text-muted">
                {clinica.tipoAcesso === "gratuito"
                  ? "A troca de plano mantém o prazo do teste. O plano entra no próximo login."
                  : "Altere o plano e a situação da cobrança. O plano entra no próximo login."}
              </p>
            </div>
            <button
              type="button"
              onClick={fechar}
              className="rounded-lg p-1.5 text-muted hover:bg-paper"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
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

            <fieldset>
              <legend className="text-sm font-medium">Situação</legend>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-line p-1">
                {situacoes.map((item) => (
                  <label key={item.valor} className="cursor-pointer">
                    <input
                      type="radio"
                      name="situacao"
                      value={item.valor}
                      defaultChecked={item.valor === clinica.situacaoCobranca}
                      className="peer sr-only"
                    />
                    <span className="block rounded-md px-2 py-2 text-center text-sm font-medium text-muted peer-checked:bg-ink peer-checked:text-white">
                      {item.rotulo}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </form>

        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <form action={ativa ? desativarClinica : ativarClinica}>
              <input type="hidden" name="clinicaId" value={clinica.id} />
              <button
                type="submit"
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:border-brand"
              >
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
              <button
                type="submit"
                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-danger hover:bg-rose-50"
              >
                Excluir
              </button>
            </form>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={fechar} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-paper">
              Cancelar
            </button>
            <button
              type="submit"
              form={formId}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              Salvar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
