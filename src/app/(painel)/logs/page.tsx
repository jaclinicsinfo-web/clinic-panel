import Link from "next/link";

import { reais } from "@/lib/dinheiro";
import { listarEventos, MEIOS, resumoEventos, TIPOS_EVENTO, type EventoPagamento } from "@/lib/logs";

import { AtualizarSozinho } from "./atualizar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Logs" };

const classeNivel: Record<string, string> = {
  info: "bg-emerald-50 text-emerald-800",
  aviso: "bg-amber-50 text-amber-800",
  erro: "bg-rose-50 text-danger",
};

const rotuloStatus: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  in_process: "Em análise",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Devolvido",
  charged_back: "Chargeback",
  pago: "Pago",
  pendente: "Pendente",
  revisao: "Revisão",
};

function quando(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function Cartao({ titulo, valor, detalhe, alerta }: { titulo: string; valor: string; detalhe: string; alerta?: boolean }) {
  return (
    <article className={`rounded-2xl border bg-card p-5 ${alerta ? "border-rose-200" : "border-line"}`}>
      <p className="text-sm text-muted">{titulo}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${alerta ? "text-danger" : ""}`}>{valor}</p>
      <p className="mt-1 text-xs text-muted">{detalhe}</p>
    </article>
  );
}

function meioDoEvento(evento: EventoPagamento) {
  if (!evento.meio) return "—";
  const parcelas = Number((evento.detalhes as { parcelas?: number } | null)?.parcelas ?? 0);
  const nome = MEIOS[evento.meio] ?? evento.meio;
  return parcelas > 1 ? `${nome} · ${parcelas}x` : nome;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; tipo?: string; meio?: string; busca?: string }>;
}) {
  const filtro = await searchParams;
  const [eventos, resumo] = await Promise.all([listarEventos(filtro), resumoEventos()]);
  const filtrando = Boolean(filtro.nivel || filtro.tipo || filtro.meio || filtro.busca);

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Pagamentos</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Logs</h1>
        <AtualizarSozinho />
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Cada passo do pagamento: checkout aberto, avisos do Mercado Pago (webhook), consulta do pagamento com Pix ou
        cartão, confirmação, estorno, conferência periódica, lembretes de cobrança e e-mails. Clique no pedido para ver a
        linha do tempo dele.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao titulo="Pedidos pagos (24 h)" valor={String(resumo.pagos)} detalhe={reais(resumo.valorPago)} />
        <Cartao titulo="Pix aguardando (24 h)" valor={String(resumo.pixAguardando)} detalhe="QR gerado, ainda não pago" />
        <Cartao
          titulo="Avisos recusados (24 h)"
          valor={String(resumo.avisosRecusados)}
          detalhe="x-signature ausente ou errada"
          alerta={resumo.avisosRecusados > 0}
        />
        <Cartao titulo="Erros (24 h)" valor={String(resumo.erros)} detalhe="Revisar abaixo" alerta={resumo.erros > 0} />
        <Cartao
          titulo="Fila de e-mails"
          valor={String(resumo.filaPendente)}
          detalhe={resumo.filaDesistiu > 0 ? `${resumo.filaDesistiu} sem envio nos últimos 7 dias` : "Aguardando envio ou nova tentativa"}
          alerta={resumo.filaDesistiu > 0}
        />
        <Cartao
          titulo="E-mails com falha (24 h)"
          valor={String(resumo.emailsFalha)}
          detalhe="Tentativas que não saíram (SMTP)"
          alerta={resumo.emailsFalha > 0}
        />
        <Cartao
          titulo="Aplicados pela conferência (24 h)"
          valor={String(resumo.conferencia)}
          detalhe="Pagamento ou estorno que o aviso perdeu"
          alerta={resumo.conferencia > 0}
        />
        <Cartao titulo="Lembretes de cobrança (24 h)" valor={String(resumo.lembretes)} detalhe="Clínicas avisadas por e-mail" />
      </section>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4" action="/logs">
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Nível</span>
          <select name="nivel" defaultValue={filtro.nivel ?? ""} className="mt-1 rounded-lg border border-line bg-paper px-2 py-1.5">
            <option value="">Todos</option>
            <option value="info">Info</option>
            <option value="aviso">Aviso</option>
            <option value="erro">Erro</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Evento</span>
          <select name="tipo" defaultValue={filtro.tipo ?? ""} className="mt-1 rounded-lg border border-line bg-paper px-2 py-1.5">
            <option value="">Todos</option>
            {Object.entries(TIPOS_EVENTO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-muted">Meio</span>
          <select name="meio" defaultValue={filtro.meio ?? ""} className="mt-1 rounded-lg border border-line bg-paper px-2 py-1.5">
            <option value="">Todos</option>
            {Object.entries(MEIOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="block text-xs font-medium text-muted">Buscar</span>
          <input
            name="busca"
            defaultValue={filtro.busca ?? ""}
            placeholder="Pedido, pagamento do MP, clínica ou texto"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-2 py-1.5"
          />
        </label>
        <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong">
          Filtrar
        </button>
        {filtrando ? (
          <Link href="/logs" className="text-sm text-muted hover:text-brand">
            Limpar
          </Link>
        ) : null}
      </form>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        {eventos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Nenhum evento {filtrando ? "com esse filtro" : "ainda"}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Quando</th>
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-4 py-3 font-medium">Clínica / pedido</th>
                  <th className="px-4 py-3 font-medium">Meio</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{quando(evento.criadoEm)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classeNivel[evento.nivel] ?? "bg-paper text-muted"}`}>
                        {TIPOS_EVENTO[evento.tipo] ?? evento.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {evento.clinicaId ? (
                        <Link href={`/clinicas/${evento.clinicaId}`} className="font-medium hover:text-brand">
                          {evento.clinicaNome ?? "Clínica"}
                        </Link>
                      ) : (
                        <span className="font-medium">{evento.clinicaNome ?? "—"}</span>
                      )}
                      {evento.pedidoId ? (
                        <Link href={`/logs?busca=${evento.pedidoId}`} className="mt-0.5 block font-mono text-[11px] text-muted hover:text-brand">
                          pedido {evento.pedidoId.slice(0, 8)}
                        </Link>
                      ) : null}
                      {evento.pagamentoId ? (
                        <span className="mt-0.5 block font-mono text-[11px] text-muted">MP {evento.pagamentoId}</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{meioDoEvento(evento)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{evento.status ? rotuloStatus[evento.status] ?? evento.status : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{evento.valor ? reais(evento.valor) : "—"}</td>
                    <td className="max-w-[420px] px-4 py-3">
                      <p>{evento.mensagem}</p>
                      {evento.detalhes ? (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-muted hover:text-brand">Dados técnicos</summary>
                          <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-paper p-2 text-[11px] leading-relaxed">
                            {JSON.stringify(evento.detalhes, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                      {evento.tipo === "acesso_falhou" ? (
                        <Link href="/leads" className="mt-1 inline-block text-xs font-medium text-brand hover:text-brand-strong">
                          Reenviar acesso em Leads
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-3 text-xs text-muted">Mostrando os {eventos.length} eventos mais recentes (máximo 200).</p>
    </main>
  );
}
