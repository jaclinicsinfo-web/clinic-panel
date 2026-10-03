import { Pool, type PoolClient } from "pg";

import { ambiente } from "@/lib/ambiente";

const globalPool = globalThis as unknown as { clinicPanelPool?: Pool };

function pool() {
  if (!globalPool.clinicPanelPool) {
    const url = new URL(ambiente().databaseUrl);
    url.searchParams.delete("sslmode");
    globalPool.clinicPanelPool = new Pool({
      connectionString: url.toString(),
      ssl: false,
      max: 5,
    });
  }
  return globalPool.clinicPanelPool;
}

export async function comSistema<T>(fn: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool().connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query(`SELECT set_config('app.modo_sistema', 'on', true)`);
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
}
