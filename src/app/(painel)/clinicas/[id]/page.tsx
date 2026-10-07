import Link from "next/link";
import { notFound } from "next/navigation";

import { salvarLogin, salvarPlano } from "@/app/(painel)/acoes";
import { Aviso, Campo } from "@/components/campo";
import { buscarClinica, catalogoPlanos } from "@/lib/clinicas";
import { rotuloAcesso } from "@/lib/acesso";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clínica" };

export default async function ClinicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { id } = await params;
  const avisos = await searchParams;
  const clinica = await buscarClinica(id);
  if (!clinica) notFound();
  const planos = catalogoPlanos();

  return (
    <main className="max-w-3xl">
      <Link href="/clinicas" className="text-sm text-muted hover:text-ink">
        Voltar
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">{clinica.nomeFantasia}</h1>
      <p className="mt-1 text-sm text-muted">{clinica.razaoSocial}</p>
      <p className="mt-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${rotuloAcesso(clinica.tipoAcesso, clinica.trialExpiraEm).classe}`}
        >
          {clinica.planoNome} · {rotuloAcesso(clinica.tipoAcesso, clinica.trialExpiraEm).texto}
        </span>
      </p>
      <div className="mt-4">
        <Aviso erro={avisos.erro} ok={avisos.ok} />
      </div>

      <form action={salvarPlano} className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Plano em uso</h2>
        <p className="mt-1 text-sm text-muted">A clínica passa a ver os módulos deste plano no próximo login.</p>
        <input type="hidden" name="clinicaId" value={clinica.id} />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {planos.map((plano) => (
            <label key={plano.codigo} className="rounded-xl border border-line px-3 py-3 text-sm">
              <input
                type="radio"
                name="plano"
                value={plano.codigo}
                defaultChecked={plano.codigo === clinica.planoCodigo}
                className="mr-2"
              />
              <span className="font-medium">{plano.nome}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong">
          Salvar plano
        </button>
      </form>

      <form action={salvarLogin} className="mt-4 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Login inicial</h2>
        <p className="mt-1 text-sm text-muted">
          Troca o e-mail e a senha do administrador {clinica.adminNome ? `(${clinica.adminNome})` : ""}.
        </p>
        <input type="hidden" name="clinicaId" value={clinica.id} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo nome="email" rotulo="E-mail" tipo="email" valor={clinica.adminEmail ?? ""} />
          <Campo nome="senha" rotulo="Nova senha" tipo="password" placeholder="Mínimo de 8 caracteres" />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
          Atualizar login
        </button>
      </form>
    </main>
  );
}
