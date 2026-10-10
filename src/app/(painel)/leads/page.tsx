import Link from "next/link";

import { reenviarAcesso } from "@/app/(painel)/acoes";
import { Aviso } from "@/components/campo";
import { reais } from "@/lib/dinheiro";
import { listarAcessosPendentes, listarLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

const planos: Record<string, string> = {
  essencial: "Essencial",
  profissional: "Profissional",
  ilimitado: "Ilimitado",
};

const situacao: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: "Aguardando pagamento", classe: "bg-amber-50 text-amber-800" },
  processando: { texto: "Confirmando pagamento", classe: "bg-amber-50 text-amber-800" },
  revisao: { texto: "Pago, clínica não aberta (CNPJ ou e-mail já existe)", classe: "bg-rose-50 text-danger" },
};

function quando(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const avisos = await searchParams;
  const [leads, acessos] = await Promise.all([listarLeads(), listarAcessosPendentes()]);

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Site</p>
      <h1 className="mt-1 text-3xl font-semibold">Leads</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Só entram pela landing, quando alguém escolhe um plano e ainda não concluiu o pagamento. O teste de 7 dias e o pagamento aprovado abrem a clínica e ela passa para{" "}
        <Link href="/clinicas" className="font-medium text-brand hover:text-brand-strong">
          Clínicas
        </Link>
        . O painel também pode abrir uma clínica direto, sem passar por aqui.
      </p>

      <div className="mt-4">
        <Aviso erro={avisos.erro} ok={avisos.ok} />
      </div>

      {acessos.length > 0 ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-rose-200 bg-card">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold">Acesso não entregue</h2>
            <p className="mt-1 text-sm text-muted">
              Pagamento aprovado e clínica aberta, mas o e-mail com a senha não saiu e o administrador ainda não entrou.
              Reenviar gera outra senha temporária.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Clínica</th>
                  <th className="px-5 py-3 font-medium">Administrador</th>
                  <th className="px-5 py-3 font-medium">Pago em</th>
                  <th className="px-5 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {acessos.map((acesso) => (
                  <tr key={acesso.id} className="border-t border-line">
                    <td className="px-5 py-3 font-medium">{acesso.nomeFantasia}</td>
                    <td className="px-5 py-3">{acesso.email || "—"}</td>
                    <td className="px-5 py-3">{quando(acesso.pagoEm)}</td>
                    <td className="px-5 py-3">
                      <form action={reenviarAcesso}>
                        <input type="hidden" name="pedidoId" value={acesso.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-paper"
                        >
                          Reenviar acesso
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        {leads.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Nenhum lead aguardando pagamento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Clínica</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Plano</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-5 py-3 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const rotulo = situacao[lead.status] ?? {
                    texto: lead.status,
                    classe: "bg-paper text-muted",
                  };
                  return (
                    <tr key={lead.id} className="border-t border-line">
                      <td className="px-5 py-3 font-medium">{lead.nomeFantasia}</td>
                      <td className="px-5 py-3">{lead.email || "—"}</td>
                      <td className="px-5 py-3">
                        {planos[lead.planoCodigo] ?? lead.planoCodigo}
                        <span className="mt-1 block text-xs text-muted">{lead.ciclo === "anual" ? "Anual" : "Mensal"}</span>
                      </td>
                      <td className="px-5 py-3">{reais(lead.valor)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${rotulo.classe}`}>
                          {rotulo.texto}
                        </span>
                      </td>
                      <td className="px-5 py-3">{quando(lead.criadoEm)}</td>
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
