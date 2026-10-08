import Link from "next/link";

import { FormularioNovaClinica } from "@/app/(painel)/clinicas/nova/formulario";
import { catalogoPlanos } from "@/lib/clinicas";

export const metadata = { title: "Abrir clínica" };

export default function NovaClinicaPage() {
  const planos = catalogoPlanos();

  return (
    <main className="max-w-3xl">
      <Link href="/clinicas" className="text-sm text-muted hover:text-ink">
        Voltar
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">Abrir clínica</h1>
      <p className="mt-2 text-sm text-muted">
        Abre a clínica direto neste painel, com plano e login inicial. Quem escolhe o plano no site paga ou começa o teste de 7 dias e também entra nesta lista.
      </p>

      <FormularioNovaClinica planos={planos} />
    </main>
  );
}
