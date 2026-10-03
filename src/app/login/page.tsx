import { destinoSeLogado, entrar } from "./acoes";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await destinoSeLogado();
  const { erro } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form action={entrar} className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Equipe interna</p>
        <h1 className="mt-2 text-2xl font-semibold">Painel das clínicas</h1>
        <p className="mt-2 text-sm text-muted">Acesso da operação. Não é o login de uma clínica.</p>

        {erro && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-danger">E-mail ou senha incorretos.</p>
        )}

        <label className="mt-6 block text-sm font-medium" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
        />

        <button type="submit" className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-strong">
          Entrar
        </button>
      </form>
    </main>
  );
}
