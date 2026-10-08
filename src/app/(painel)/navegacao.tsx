"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", rotulo: "Financeiro" },
  { href: "/clinicas", rotulo: "Clínicas" },
  { href: "/planos", rotulo: "Planos" },
  { href: "/leads", rotulo: "Leads" },
];

export function NavegacaoPainel() {
  const caminho = usePathname();

  return (
    <nav className="flex gap-1 px-3 py-4 md:flex-col">
      {links.map((link) => {
        const ativo = link.href === "/" ? caminho === "/" : caminho.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm ${
              ativo ? "bg-white/15 font-medium text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
