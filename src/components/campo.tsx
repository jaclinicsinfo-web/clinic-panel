export function Campo({
  nome,
  rotulo,
  tipo = "text",
  obrigatorio = true,
  valor,
  placeholder,
}: {
  nome: string;
  rotulo: string;
  tipo?: string;
  obrigatorio?: boolean;
  valor?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{rotulo}</span>
      <input
        name={nome}
        type={tipo}
        required={obrigatorio}
        defaultValue={valor}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
      />
    </label>
  );
}

export function Aviso({ erro, ok }: { erro?: string; ok?: string }) {
  if (erro) return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-danger">{erro}</p>;
  if (ok === "criada") return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Clínica aberta. O administrador já pode entrar no painel da clínica.</p>;
  if (ok === "plano") return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Plano atualizado. Vale no próximo login da clínica.</p>;
  if (ok === "login") return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Login inicial atualizado.</p>;
  return null;
}
