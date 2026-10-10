export function rotuloAcesso(tipoAcesso: string, trialExpiraEm: string | null) {
  if (tipoAcesso !== "gratuito") {
    return { texto: "Pago", classe: "bg-emerald-50 text-emerald-800" };
  }

  const expira = trialExpiraEm ? new Date(trialExpiraEm) : null;
  if (!expira || Number.isNaN(expira.getTime()) || expira.getTime() <= Date.now()) {
    return { texto: "Gratuito encerrado", classe: "bg-rose-50 text-danger" };
  }

  const data = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(expira);
  const dias = Math.ceil((expira.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const prazo = dias === 1 ? "1 dia" : `${dias} dias`;

  return { texto: `Gratuito · ${prazo} (até ${data})`, classe: "bg-amber-50 text-amber-800" };
}

const DIAS_CARENCIA = 5;
const DIA_MS = 24 * 60 * 60 * 1000;

function dataCurta(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(data);
}

/**
 * Clínica paga pelo Mercado Pago: a situação sai do vencimento (5 dias de carência, depois bloqueia).
 * Sem vencimento, vale a situação marcada à mão no painel.
 */
export function situacaoPorVencimento(pagoAte: string | null) {
  if (!pagoAte) return null;
  const vence = new Date(pagoAte);
  if (Number.isNaN(vence.getTime())) return null;
  const bloqueia = new Date(vence.getTime() + DIAS_CARENCIA * DIA_MS);
  const agora = Date.now();
  if (vence.getTime() > agora) {
    return { texto: `Em dia · até ${dataCurta(vence)}`, classe: "bg-emerald-50 text-emerald-800" };
  }
  if (bloqueia.getTime() > agora) {
    return { texto: `Atrasada · bloqueia ${dataCurta(bloqueia)}`, classe: "bg-amber-50 text-amber-800" };
  }
  return { texto: `Bloqueada desde ${dataCurta(bloqueia)}`, classe: "bg-rose-50 text-danger" };
}
