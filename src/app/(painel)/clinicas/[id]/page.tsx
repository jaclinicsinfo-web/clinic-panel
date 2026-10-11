import Link from "next/link";
import { notFound } from "next/navigation";

import { salvarLogin, salvarPlano } from "@/app/(painel)/acoes";
import { TabelaPagamentos } from "@/app/(painel)/pagamentos/tabela";
import { Aviso, Campo } from "@/components/campo";
import { buscarAutomatica, MOTIVO_CANCELAMENTO, STATUS_AUTOMATICA } from "@/lib/automatica";
import { buscarClinica, catalogoPlanos } from "@/lib/clinicas";
import { rotuloAcesso } from "@/lib/acesso";
import { reais } from "@/lib/dinheiro";
import { dataBR, listarPagamentos, rotuloCiclo } from "@/lib/pagamentos";

import { CancelarAutomatica } from "./cancelar-automatica";

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

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
  const [automatica, { pagamentos, totais }] = await Promise.all([
    buscarAutomatica(clinica.id),
    listarPagamentos({ clinicaId: clinica.id }),
  ]);
  const statusAutomatica = automatica
    ? (STATUS_AUTOMATICA[automatica.status] ?? { texto: automatica.status, classe: "bg-paper text-muted" })
    : null;

  return (
    <main className="max-w-4xl">
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
          {clinica.cicloCobranca === "anual" ? " · Anual à vista" : ""}
        </span>
      </p>
      {clinica.planoAgendadoNome ? (
        <p className="mt-2 text-sm text-amber-800">
          Troca agendada: plano {clinica.planoAgendadoNome}
          {clinica.cicloAgendado ? ` (${rotuloCiclo(clinica.cicloAgendado).toLowerCase()})` : ""}
          {clinica.pagoAte ? ` a partir de ${dataBR(clinica.pagoAte)}` : " no próximo vencimento"}.
        </p>
      ) : null}
      <div className="mt-4">
        <Aviso erro={avisos.erro} ok={avisos.ok} />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Cobrança automática</h2>
            <p className="mt-1 text-sm text-muted">
              Cartão autorizado no Mercado Pago, cobrado no vencimento. O administrador liga e desliga em Configurações ›
              Assinatura.
            </p>
          </div>
          {statusAutomatica ? (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusAutomatica.classe}`}>
              {statusAutomatica.texto}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-muted">Desligada</span>
          )}
        </div>

        {automatica ? (
          <>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Dado rotulo="Plano e valor">
                {automatica.planoNome ?? automatica.planoCodigo} · {rotuloCiclo(automatica.ciclo)} · {reais(automatica.valor)}
              </Dado>
              <Dado rotulo="Cartão">{automatica.cartaoFinal ? `Final ${automatica.cartaoFinal}` : "—"}</Dado>
              <Dado rotulo="Próxima cobrança">
                {automatica.status === "cancelada" ? "—" : dataBR(automatica.proximaCobrancaEm) || "—"}
              </Dado>
              {automatica.ultimaFalhaEm ? (
                <Dado rotulo="Última falha">
                  <span className="text-danger">
                    {dataBR(automatica.ultimaFalhaEm)}
                    {automatica.ultimaFalhaMotivo ? ` · ${automatica.ultimaFalhaMotivo}` : ""}
                  </span>
                </Dado>
              ) : null}
              {automatica.valorNovo && automatica.valorNovoEm && automatica.status !== "cancelada" ? (
                <Dado rotulo="Reajuste agendado">
                  {reais(automatica.valorNovo)} a partir de {dataBR(automatica.valorNovoEm)}
                </Dado>
              ) : null}
              {automatica.ativadaEm ? <Dado rotulo="Ativada em">{dataBR(automatica.ativadaEm)}</Dado> : null}
              {automatica.status === "cancelada" ? (
                <Dado rotulo="Cancelada">
                  {dataBR(automatica.canceladaEm) || "—"}
                  {automatica.motivoCancelamento
                    ? ` ${MOTIVO_CANCELAMENTO[automatica.motivoCancelamento] ?? `(${automatica.motivoCancelamento})`}`
                    : ""}
                </Dado>
              ) : null}
            </dl>
            {automatica.status !== "cancelada" ? (
              <div className="mt-4">
                <CancelarAutomatica clinicaId={clinica.id} />
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">Nunca foi ativada. A clínica paga cada período pelo checkout (Pix ou cartão).</p>
        )}
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-semibold">Pagamentos</h2>
            <p className="mt-1 text-sm text-muted">
              Total pago desde o início: <span className="font-medium text-ink">{reais(totais.liquido)}</span>
              {totais.devolvido > 0 ? ` (${reais(totais.devolvido)} devolvidos)` : ""}
            </p>
          </div>
          <Link href={`/logs?busca=${clinica.id}`} className="text-sm font-medium text-brand hover:text-brand-strong">
            Ver no Logs
          </Link>
        </div>
        {pagamentos.length === 0 ? (
          <p className="border-t border-line px-5 py-6 text-sm text-muted">Nenhum pagamento pelo Mercado Pago ainda.</p>
        ) : (
          <div className="border-t border-line">
            <TabelaPagamentos pagamentos={pagamentos} totais={totais} comClinica={false} />
          </div>
        )}
      </section>

      <form action={salvarPlano} className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Plano em uso</h2>
        <p className="mt-1 text-sm text-muted">
          A clínica passa a ver os módulos deste plano no próximo login. O prazo do teste, se houver, continua o mesmo.
        </p>
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
