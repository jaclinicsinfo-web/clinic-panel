"use client";

import { useActionState } from "react";

import { criarClinica, type EstadoNovaClinica } from "@/app/(painel)/acoes";
import { Aviso, Campo } from "@/components/campo";
import type { Plano } from "@/lib/clinicas";

const inicial: EstadoNovaClinica = {
  id: 0,
  valores: {
    plano: "",
    adminNome: "",
    adminEmail: "",
    adminSenha: "",
    nomeFantasia: "",
    razaoSocial: "",
    cnpj: "",
    telefone: "",
    emailClinica: "",
    unidadeNome: "",
    unidadeCidade: "",
  },
};

export function FormularioNovaClinica({ planos }: { planos: Plano[] }) {
  const [estado, acao, pendente] = useActionState(criarClinica, inicial);
  const planoSelecionado = estado.valores.plano || planos[0]?.codigo;

  return (
    <form action={acao} key={estado.id} className="mt-6 space-y-6">
      <Aviso erro={estado.erro} />

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Plano</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {planos.map((plano) => (
            <label key={plano.codigo} className="rounded-xl border border-line px-3 py-3 text-sm">
              <input
                type="radio"
                name="plano"
                value={plano.codigo}
                defaultChecked={plano.codigo === planoSelecionado}
                className="mr-2"
                required
              />
              <span className="font-medium">{plano.nome}</span>
              <span className="mt-1 block text-xs text-muted">
                {plano.limiteUsuarios ? `Até ${plano.limiteUsuarios} usuários` : "Usuários sem teto"}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-semibold">Login inicial</h2>
        <Campo nome="adminNome" rotulo="Nome do administrador" valor={estado.valores.adminNome} />
        <Campo nome="adminEmail" rotulo="E-mail" tipo="email" placeholder="admin@clinica.com.br" valor={estado.valores.adminEmail} />
        <Campo nome="adminSenha" rotulo="Senha" tipo="password" placeholder="Mínimo de 8 caracteres" valor={estado.valores.adminSenha} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-semibold">Clínica e primeira unidade</h2>
        <Campo nome="nomeFantasia" rotulo="Nome fantasia" valor={estado.valores.nomeFantasia} />
        <Campo nome="razaoSocial" rotulo="Razão social" valor={estado.valores.razaoSocial} />
        <Campo nome="cnpj" rotulo="CNPJ" placeholder="00.000.000/0000-00" valor={estado.valores.cnpj} />
        <Campo nome="telefone" rotulo="Telefone" placeholder="(16) 99999-0000" valor={estado.valores.telefone} />
        <Campo nome="emailClinica" rotulo="E-mail da clínica" tipo="email" valor={estado.valores.emailClinica} />
        <Campo nome="unidadeNome" rotulo="Unidade" placeholder="Matriz" valor={estado.valores.unidadeNome} />
        <Campo nome="unidadeCidade" rotulo="Cidade" valor={estado.valores.unidadeCidade} />
      </section>

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pendente ? "Abrindo..." : "Abrir clínica"}
      </button>
    </form>
  );
}
