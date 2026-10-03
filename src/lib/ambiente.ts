function exigir(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`Defina ${nome} no .env do clinic-panel.`);
  return valor;
}

export function ambiente() {
  return {
    databaseUrl: exigir("DATABASE_URL"),
    apiUrl: exigir("API_URL").replace(/\/$/, ""),
    landingApiKey: exigir("LANDING_API_KEY"),
    panelEmail: exigir("PANEL_EMAIL").toLowerCase(),
    panelPassword: exigir("PANEL_PASSWORD"),
    panelSecret: exigir("PANEL_SECRET"),
  };
}
