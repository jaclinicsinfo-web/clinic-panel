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

/** Mês corrente no fuso de São Paulo (o servidor pode estar em UTC). */
export function periodoDoMes(referencia = new Date()) {
  const [ano, mes] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
    .format(referencia)
    .split("-")
    .map(Number);
  const iso = (a: number, m: number) => `${a}-${String(m).padStart(2, "0")}-01`;
  const proximo = mes === 12 ? { a: ano + 1, m: 1 } : { a: ano, m: mes + 1 };
  const rotulo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(ano, mes - 1, 15)),
  );
  return { inicio: iso(ano, mes), fim: iso(proximo.a, proximo.m), rotulo };
}
