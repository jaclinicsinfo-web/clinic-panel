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

  return { texto: `Gratuito até ${data}`, classe: "bg-amber-50 text-amber-800" };
}
