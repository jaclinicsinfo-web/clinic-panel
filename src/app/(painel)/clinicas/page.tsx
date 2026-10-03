import Link from "next/link";

import { Aviso } from "@/components/campo";
import { listarClinicas } from "@/lib/clinicas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clínicas" };

function cnpj(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 14) return valor;
  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export default async function ClinicasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const avisos = await searchParams;
  const clinicas = await listarClinicas();

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Contas</p>
          <h1 className="mt-1 text-3xl font-semibold">Clínicas</h1>
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
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Clínica</th>
                  <th className="px-5 py-3 font-medium">CNPJ</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Login inicial</th>
                </tr>
              </thead>
              <tbody>
                {clinicas.map((clinica) => (
                  <tr key={clinica.id} className="border-t border-line">
                    <td className="px-5 py-3">
                      <Link href={`/clinicas/${clinica.id}`} className="font-medium hover:text-brand">
                        {clinica.nomeFantasia}
                      </Link>
                      <p className="text-xs text-muted">{clinica.email}</p>
                    </td>
                    <td className="px-5 py-3">{cnpj(clinica.cnpj)}</td>
                    <td className="px-5 py-3">{clinica.planoNome}</td>
                    <td className="px-5 py-3">{clinica.adminEmail ?? "Sem administrador"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
