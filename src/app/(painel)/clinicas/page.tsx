import Link from "next/link";

import { AcoesClinica } from "@/app/(painel)/clinicas/acoes";
import { Aviso } from "@/components/campo";
import { catalogoPlanos, listarClinicas } from "@/lib/clinicas";
import { reais } from "@/lib/dinheiro";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clínicas" };

function cnpj(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 14) return valor;
  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

const rotuloSituacao: Record<string, string> = {
  em_dia: "Em dia",
  pendente: "Pendente",
  atrasada: "Atrasada",
};

const classeSituacao: Record<string, string> = {
  em_dia: "bg-emerald-50 text-emerald-800",
  pendente: "bg-amber-50 text-amber-800",
  atrasada: "bg-rose-50 text-danger",
};

export default async function ClinicasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const avisos = await searchParams;
  const clinicas = await listarClinicas();
  const planos = catalogoPlanos();

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Contas</p>
          <h1 className="mt-1 text-3xl font-semibold">Clínicas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Use Ações para mudar o plano, a mensalidade e o acesso da clínica.
          </p>
        </div>
        <Link href="/clinicas/nova" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong">
          Abrir clínica
        </Link>
      </div>

      <div className="mt-4">
        <Aviso erro={avisos.erro} ok={avisos.ok} />
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        {clinicas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Nenhuma clínica cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Clínica</th>
                  <th className="px-5 py-3 font-medium">CNPJ</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Login inicial</th>
                  <th className="px-5 py-3 font-medium">Mensalidade</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clinicas.map((clinica) => {
                  const ativa = clinica.status !== "desativada";
                  return (
                    <tr key={clinica.id} className="border-t border-line">
                      <td className="px-5 py-3">
                        <Link href={`/clinicas/${clinica.id}`} className="font-medium hover:text-brand">
                          {clinica.nomeFantasia}
                        </Link>
                        {ativa ? null : <p className="mt-1 text-xs font-medium text-danger">Desativada</p>}
                      </td>
                      <td className="px-5 py-3">{cnpj(clinica.cnpj)}</td>
                      <td className="px-5 py-3 font-medium">{clinica.planoNome}</td>
                      <td className="px-5 py-3">{clinica.adminEmail ?? "Sem administrador"}</td>
                      <td className="px-5 py-3">{reais(clinica.valorMensal)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classeSituacao[clinica.situacaoCobranca] ?? "bg-paper text-muted"}`}
                        >
                          {rotuloSituacao[clinica.situacaoCobranca] ?? clinica.situacaoCobranca}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <AcoesClinica
                          clinica={{
                            id: clinica.id,
                            nomeFantasia: clinica.nomeFantasia,
                            planoCodigo: clinica.planoCodigo,
                            valorMensal: clinica.valorMensal,
                            situacaoCobranca: clinica.situacaoCobranca,
                            status: clinica.status,
                          }}
                          planos={planos}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
