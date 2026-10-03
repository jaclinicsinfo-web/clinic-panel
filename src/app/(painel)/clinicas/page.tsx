import Link from "next/link";

import { salvarCobranca } from "@/app/(painel)/acoes";
import { AcoesClinica } from "@/app/(painel)/clinicas/acoes";
import { Aviso } from "@/components/campo";
import { listarClinicas } from "@/lib/clinicas";
import { reais } from "@/lib/dinheiro";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clínicas" };

function cnpj(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 14) return valor;
  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function campoMensalidade(valor: string) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

const situacoes = [
  { valor: "em_dia", rotulo: "Em dia" },
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "atrasada", rotulo: "Atrasada" },
];

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
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Desativar avisa no login que a clínica está desativada. Excluir apaga a conta e o login passa a dizer que o usuário não existe.
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
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Clínica</th>
                  <th className="px-5 py-3 font-medium">CNPJ</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Login inicial</th>
                  <th className="px-5 py-3 font-medium">Mensalidade</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clinicas.map((clinica) => {
                  const ativa = clinica.status !== "desativada";
                  return (
                    <tr key={clinica.id} className="border-t border-line align-top">
                      <td className="px-5 py-3">
                        <Link href={`/clinicas/${clinica.id}`} className="font-medium hover:text-brand">
                          {clinica.nomeFantasia}
                        </Link>
                        <p className="text-xs text-muted">{clinica.email}</p>
                        {ativa ? null : (
                          <p className="mt-1 text-xs font-medium text-danger">Desativada</p>
                        )}
                      </td>
                      <td className="px-5 py-3">{cnpj(clinica.cnpj)}</td>
                      <td className="px-5 py-3">{clinica.planoNome}</td>
                      <td className="px-5 py-3">{clinica.adminEmail ?? "Sem administrador"}</td>
                      <td className="px-5 py-3">
                        <form action={salvarCobranca} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="clinicaId" value={clinica.id} />
                          <input
                            name="valor"
                            inputMode="decimal"
                            defaultValue={campoMensalidade(clinica.valorMensal)}
                            aria-label={`Mensalidade de ${clinica.nomeFantasia}`}
                            className="w-28 rounded-lg border border-line bg-white px-2 py-1.5 outline-none focus:border-brand"
                          />
                          <select
                            name="situacao"
                            defaultValue={clinica.situacaoCobranca}
                            aria-label={`Situação da cobrança de ${clinica.nomeFantasia}`}
                            className="rounded-lg border border-line bg-white px-2 py-1.5 outline-none focus:border-brand"
                          >
                            {situacoes.map((item) => (
                              <option key={item.valor} value={item.valor}>
                                {item.rotulo}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white">
                            Salvar
                          </button>
                        </form>
                        <p className="mt-1 text-xs text-muted">{reais(clinica.valorMensal)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <AcoesClinica id={clinica.id} ativa={ativa} />
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
