import { Redis } from 'ioredis';
import { env } from './env';

/**
 * Cliente único de Redis, compartido por toda la API (sesiones, y más adelante caché).
 * Se crea una sola vez al importar este módulo.
 */
export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });

// Sin este listener, un error de conexión sin manejar tumbaría todo el proceso.
redis.on('error', (error) => {
  console.error('[redis]', error.message);
});
