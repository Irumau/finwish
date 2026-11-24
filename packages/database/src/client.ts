import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta la variable de entorno DATABASE_URL (ver .env.example)');
}

// Pool = conjunto de conexiones reutilizables. La API y el worker comparten este cliente.
export const pool = new Pool({ connectionString, max: 10 });

// `db` es lo que se usa para consultar. Pasar `schema` habilita consultas tipadas.
export const db = drizzle({ client: pool, schema });

export type Database = typeof db;
export * from './schema';
