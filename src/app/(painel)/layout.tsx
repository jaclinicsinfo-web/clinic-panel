import { sair } from "@/app/login/acoes";
import { NavegacaoPainel } from "@/app/(painel)/navegacao";
import { exigirSessao } from "@/lib/sessao";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await exigirSessao();

  return (
    <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-ink text-white">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-xs uppercase tracking-[0.16em] text-teal-200">J.A. Clinics</p>
          <p className="mt-1 text-lg font-semibold">Painel interno</p>
        </div>
        <NavegacaoPainel />
        <form action={sair} className="mt-auto p-3">
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10">
            Sair
          </button>
        </form>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
