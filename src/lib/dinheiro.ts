export function reais(valor: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}

export function periodoDoMes(referencia = new Date()) {
  const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 1);
  const iso = (data: Date) => {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
  };
  const rotulo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(inicio);
  return { inicio: iso(inicio), fim: iso(fim), rotulo };
}
