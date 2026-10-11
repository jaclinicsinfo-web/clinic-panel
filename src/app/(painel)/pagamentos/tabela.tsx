import Link from "next/link";

import { reais } from "@/lib/dinheiro";
import {
  dataBR,
  descricaoPagamento,
  detalhePagamento,
  rotuloMeio,
  rotuloStatusPagamento,
  type Pagamento,
  type TotaisPagamentos,
} from "@/lib/pagamentos";

/** Lista de pagamentos do Mercado Pago. Na ficha da clínica, sem a coluna de clínica. */
export function TabelaPagamentos({
  pagamentos,
  totais,
  comClinica = true,
}: {
  pagamentos: Pagamento[];
  totais: TotaisPagamentos;
  comClinica?: boolean;
}) {
  const colunas = comClinica ? 8 : 7;

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${comClinica ? "min-w-[1040px]" : "min-w-[860px]"}`}>
        <thead className="bg-paper text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            {comClinica ? <th className="px-4 py-3 font-medium">Clínica</th> : null}
            <th className="px-4 py-3 font-medium">Descrição</th>
            <th className="px-4 py-3 font-medium">Meio</th>
            <th className="px-4 py-3 text-right font-medium">Valor</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Recibo nº</th>
            <th className="px-4 py-3 font-medium">Pagamento MP</th>
          </tr>
        </thead>
        <tbody>
          {pagamentos.map((pagamento) => {
            const devolvido = pagamento.status === "estornado";
            const detalhe = detalhePagamento(pagamento);
            const comJuros =
              pagamento.totalPago !== null && Number(pagamento.totalPago) > Number(pagamento.valor) + 0.004;
            return (
              <tr key={pagamento.id} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-4 py-3">{dataBR(pagamento.pagoEm) || "—"}</td>
                {comClinica ? (
                  <td className="px-4 py-3">
                    {pagamento.clinicaId ? (
                      <Link href={`/clinicas/${pagamento.clinicaId}`} className="font-medium hover:text-brand">
                        {pagamento.clinicaNome}
                      </Link>
                    ) : (
                      <span className="font-medium">{pagamento.clinicaNome}</span>
                    )}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  {descricaoPagamento(pagamento)}
                  {detalhe ? <span className="mt-0.5 block text-xs text-muted">{detalhe}</span> : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{rotuloMeio(pagamento.meio, pagamento.parcelas) || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className={devolvido ? "text-muted line-through" : ""}>{reais(pagamento.valor)}</span>
                  {comJuros ? (
                    <span className="mt-0.5 block text-xs text-muted">
                      Cliente pagou {reais(pagamento.totalPago ?? 0)}
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      devolvido ? "bg-rose-50 text-danger" : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {rotuloStatusPagamento(pagamento)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{pagamento.numeroRecibo ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {pagamento.pagamentoId ? (
                    <Link
                      href={`/logs?busca=${encodeURIComponent(pagamento.pagamentoId)}`}
                      className="font-mono text-xs text-muted hover:text-brand"
                    >
                      {pagamento.pagamentoId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-line bg-paper text-sm">
          <tr>
            <td colSpan={colunas} className="px-4 py-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span>
                  <span className="text-muted">Pagamentos:</span>{" "}
                  <span className="font-medium">{totais.quantidade}</span>
                  {totais.quantidade > pagamentos.length ? (
                    <span className="text-muted"> (mostrando {pagamentos.length})</span>
                  ) : null}
                </span>
                <span>
                  <span className="text-muted">Recebido:</span> <span className="font-medium">{reais(totais.recebido)}</span>
                </span>
                <span>
                  <span className="text-muted">Devolvido:</span>{" "}
                  <span className="font-medium text-danger">{reais(totais.devolvido)}</span>
                </span>
                <span>
                  <span className="text-muted">Líquido:</span>{" "}
                  <span className="font-semibold">{reais(totais.liquido)}</span>
                </span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
