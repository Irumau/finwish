import { defineConfig } from 'drizzle-kit';

// drizzle-kit no lee el .env por sí solo. Lo cargamos desde la raíz del monorepo
// (si DATABASE_URL ya está definida en el entorno, simplemente se usa esa).
try {
  process.loadEnvFile('../../.env');
} catch {
  /* no hay .env: se usa el entorno actual */
}

export default defineConfig({
  dialect: 'postgresql',
  // Dónde está el esquema (la "fuente de verdad" de las tablas).
  schema: './src/schema/index.ts',
  // Dónde se guardan las migraciones SQL generadas.
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://finwish:finwish@localhost:5432/finwish',
  },
  strict: true, // pide confirmación antes de aplicar cambios destructivos
  verbose: true, // muestra el SQL que se va a ejecutar
});
