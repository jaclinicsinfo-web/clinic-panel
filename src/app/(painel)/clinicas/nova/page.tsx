import Link from "next/link";

import { criarClinica } from "@/app/(painel)/acoes";
import { Aviso, Campo } from "@/components/campo";
import { catalogoPlanos } from "@/lib/clinicas";

export const metadata = { title: "Abrir clínica" };

export default async function NovaClinicaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const planos = catalogoPlanos();

  return (
    <main className="max-w-3xl">
      <Link href="/clinicas" className="text-sm text-muted hover:text-ink">
        Voltar
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">Abrir clínica</h1>
      <p className="mt-2 text-sm text-muted">
        O plano e o login inicial nascem aqui. A clínica entra no painel dela com esse e-mail e essa senha.
      </p>

      <form action={criarClinica} className="mt-6 space-y-6">
        <Aviso erro={erro} />

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Plano</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {planos.map((plano, indice) => (
              <label key={plano.codigo} className="rounded-xl border border-line px-3 py-3 text-sm">
                <input type="radio" name="plano" value={plano.codigo} defaultChecked={indice === 0} className="mr-2" required />
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
          <Campo nome="adminNome" rotulo="Nome do administrador" />
          <Campo nome="adminEmail" rotulo="E-mail" tipo="email" placeholder="admin@clinica.com.br" />
          <Campo nome="adminSenha" rotulo="Senha" tipo="password" placeholder="Mínimo de 8 caracteres" />
        </section>

        <section className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 font-semibold">Clínica e primeira unidade</h2>
          <Campo nome="nomeFantasia" rotulo="Nome fantasia" />
          <Campo nome="razaoSocial" rotulo="Razão social" />
          <Campo nome="cnpj" rotulo="CNPJ" placeholder="00.000.000/0000-00" />
          <Campo nome="telefone" rotulo="Telefone" placeholder="(16) 99999-0000" />
          <Campo nome="emailClinica" rotulo="E-mail da clínica" tipo="email" />
          <Campo nome="unidadeNome" rotulo="Unidade" placeholder="Matriz" />
          <Campo nome="unidadeCidade" rotulo="Cidade" />
        </section>

        <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-strong">
          Abrir clínica
        </button>
      </form>
    </main>
  );
}
