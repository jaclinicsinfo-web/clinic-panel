/** Máscara de dinheiro: os dois últimos dígitos são os centavos. 14900 vira 149,00. */
export function mascararDinheiro(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  const preenchido = digitos.padStart(3, "0");
  const centavos = preenchido.slice(-2);
  const inteiro = preenchido.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${milhar},${centavos}`;
}

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
