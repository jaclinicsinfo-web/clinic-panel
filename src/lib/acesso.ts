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
