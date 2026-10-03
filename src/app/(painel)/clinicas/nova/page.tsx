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
        O plano e o login inicial nascem aqui. A clínica entra no painel dela com esse e-mail e essa senha.
      </p>

      <FormularioNovaClinica planos={planos} />
    </main>
  );
}
