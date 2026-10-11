import Link from "next/link";

import { catalogoPlanos } from "@/lib/clinicas";
import { MEIOS } from "@/lib/logs";
import { dataBR, lerFiltroPagamentos, listarPagamentos, STATUS_PAGAMENTO } from "@/lib/pagamentos";

import { TabelaPagamentos } from "./tabela";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagamentos" };

const LIMITE_TELA = 1000;

const campo = "mt-1 rounded-lg border border-line bg-paper px-2 py-1.5";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtro = lerFiltroPagamentos(await searchParams);
  const { pagamentos, totais } = await listarPagamentos({ ...filtro, limite: LIMITE_TELA });
  const planos = catalogoPlanos();

  const csv = new URLSearchParams(filtro).toString();
  const periodo =
    filtro.de && filtro.ate
      ? `de ${dataBR(`${filtro.de}T12:00:00Z`)} a ${dataBR(`${filtro.ate}T12:00:00Z`)}`
      : filtro.de
        ? `a partir de ${dataBR(`${filtro.de}T12:00:00Z`)}`
        : filtro.ate
          ? `até ${dataBR(`${filtro.ate}T12:00:00Z`)}`
          : "desde o início";

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Assinaturas</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Pagamentos</h1>
        <a
          href={`/pagamentos/csv?${csv}`}
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand"
        >
          Exportar CSV
        </a>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Pagamentos das assinaturas pelo Mercado Pago, de todas as clínicas: aprovados e devolvidos (estornos). Checkouts
        não pagos não aparecem. O CSV usa os mesmos filtros e abre no Excel.
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4" action="/pagamentos">
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">De</span>
          <input type="date" name="de" defaultValue={filtro.de} className={campo} />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Até</span>
          <input type="date" name="ate" defaultValue={filtro.ate} className={campo} />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Meio</span>
          <select name="meio" defaultValue={filtro.meio} className={campo}>
            <option value="">Todos</option>
            {Object.entries(MEIOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Status</span>
          <select name="status" defaultValue={filtro.status} className={campo}>
            <option value="">Todos</option>
            {Object.entries(STATUS_PAGAMENTO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Plano</span>
          <select name="plano" defaultValue={filtro.plano} className={campo}>
            <option value="">Todos</option>
            {planos.map((plano) => (
              <option key={plano.codigo} value={plano.codigo}>
                {plano.nome}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong">
          Filtrar
        </button>
        <Link href="/pagamentos" className="text-sm text-muted hover:text-brand">
          Mês atual
        </Link>
      </form>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Pagamentos {periodo}</h2>
        </div>
        {pagamentos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Nenhum pagamento com esse filtro.</p>
        ) : (
          <TabelaPagamentos pagamentos={pagamentos} totais={totais} />
        )}
      </section>
      {totais.quantidade > pagamentos.length ? (
        <p className="mt-3 text-xs text-muted">
          A tela mostra os {pagamentos.length} mais recentes. Os totais e o CSV consideram todos os {totais.quantidade}.
        </p>
      ) : null}
    </main>
  );
}
