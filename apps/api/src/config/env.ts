import { z } from 'zod';

/**
 * 1) Cargamos el archivo .env de la raíz del monorepo (si existe).
 *    Debe ejecutarse ANTES de importar cualquier módulo que lea process.env
 *    (como la conexión a la base). Por eso server.ts importa este archivo primero.
 */
try {
  process.loadEnvFile('../../.env'); // ruta relativa a apps/api, donde corre el servidor
} catch {
  /* sin .env: se usan las variables del entorno del sistema */
}

/**
 * 2) Validamos las variables con Zod. Si falta alguna o está mal, el servidor
 *    no arranca y avisa claramente cuál es el problema ("fallar rápido").
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000), // coerce: "3000" (texto) -> 3000
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // "http://a,http://b" -> ['http://a', 'http://b']
  WEB_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variables de entorno inválidas:\n${problems}`);
}

export const env = parsed.data;
