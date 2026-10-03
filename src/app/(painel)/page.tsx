import Link from "next/link";

import { reais } from "@/lib/dinheiro";
import { resumoFinanceiro } from "@/lib/financeiro";

export const dynamic = "force-dynamic";

export const metadata = { title: "Financeiro" };

function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-5">
      <p className="text-sm text-muted">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{valor}</p>
      <p className="mt-1 text-xs text-muted">{detalhe}</p>
    </article>
  );
}

export default async function FinanceiroPage() {
  const resumo = await resumoFinanceiro();

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Análise</p>
      <h1 className="mt-1 text-3xl font-semibold capitalize">{resumo.rotulo}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Recebimentos e despesas de todas as clínicas. O resultado do mês é o que entrou menos o que foi pago.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao titulo="Recebido no mês" valor={reais(resumo.recebido)} detalhe="Cobranças pagas" />
        <Cartao titulo="A receber" valor={reais(resumo.aReceber)} detalhe="Cobranças pendentes" />
        <Cartao titulo="Despesas pagas" valor={reais(resumo.despesasPagas)} detalhe="Pagas neste mês" />
        <Cartao titulo="Resultado do mês" valor={reais(resumo.resultado)} detalhe={`${reais(resumo.aPagar)} ainda a pagar`} />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">Por clínica</h2>
          <Link href="/clinicas/nova" className="text-sm font-medium text-brand hover:text-brand-strong">
            Abrir clínica
          </Link>
        </div>
        {resumo.linhas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Nenhuma clínica ainda. Abra a primeira para começar a acompanhar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Clínica</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Recebido</th>
                  <th className="px-5 py-3 font-medium">A receber</th>
                  <th className="px-5 py-3 font-medium">Despesas pagas</th>
                  <th className="px-5 py-3 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {resumo.linhas.map((linha) => {
                  const resultado = Number(linha.recebido) - Number(linha.despesasPagas);
                  return (
                    <tr key={linha.id} className="border-t border-line">
                      <td className="px-5 py-3">
                        <Link href={`/clinicas/${linha.id}`} className="font-medium hover:text-brand">
                          {linha.nomeFantasia}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{linha.planoNome}</td>
                      <td className="px-5 py-3">{reais(linha.recebido)}</td>
                      <td className="px-5 py-3">{reais(linha.aReceber)}</td>
                      <td className="px-5 py-3">{reais(linha.despesasPagas)}</td>
                      <td className="px-5 py-3">{reais(resultado)}</td>
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
