import { Aviso } from "@/components/campo";
import { CampoDinheiro } from "@/components/campo-dinheiro";
import { salvarPrecosPlanos } from "@/app/(painel)/acoes";
import { listarPrecosPlanos } from "@/lib/planos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos" };

const detalhe: Record<string, string> = {
  essencial: "Até 5 usuários e 1 unidade",
  profissional: "Até 20 usuários e unidades sem limite",
  ilimitado: "Usuários e unidades sem limite",
};

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const avisos = await searchParams;
  const planos = await listarPrecosPlanos();

  return (
    <main className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Comercial</p>
      <h1 className="mt-1 text-3xl font-semibold">Planos</h1>
      <p className="mt-2 text-sm text-muted">
        O mensal e o anual aparecem na landing. O anual é cobrado de uma vez no Mercado Pago. A mensalidade de uma clínica já aberta não muda. Nos campos, os dois últimos dígitos são os centavos: 14900 vira 149,00.
      </p>

      <div className="mt-4">
        <Aviso erro={avisos.erro} ok={avisos.ok} />
      </div>

      <form action={salvarPrecosPlanos} className="mt-4 space-y-4">
        {planos.map((plano) => (
          <section key={plano.codigo} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-semibold">{plano.nome}</h2>
            <p className="mt-1 text-sm text-muted">{detalhe[plano.codigo] ?? "Plano ativo"}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CampoDinheiro nome={`preco_${plano.codigo}`} rotulo="Preço mensal" valor={plano.precoMensal} />
              <CampoDinheiro nome={`anual_${plano.codigo}`} rotulo="Preço anual à vista" valor={plano.precoAnual} />
            </div>
          </section>
        ))}

        <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong">
          Salvar preços
        </button>
      </form>
    </main>
  );
}
