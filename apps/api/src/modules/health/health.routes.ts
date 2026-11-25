import type { FastifyInstance } from 'fastify';
import { pool } from '@finwish/database';
import { redis } from '../../config/redis';

type ServiceStatus = 'up' | 'down';

// Ejecuta una comprobación y devuelve 'up' o 'down' sin lanzar nunca error.
async function check(fn: () => Promise<unknown>): Promise<ServiceStatus> {
  try {
    await fn();
    return 'up';
  } catch {
    return 'down';
  }
}

/**
 * Un "plugin" de Fastify es una función async que recibe la instancia de la app
 * y le agrega cosas (rutas, hooks, decoradores). Así se organiza todo en Fastify:
 * cada módulo (auth, finance, wishlist…) será un plugin que se registra en app.ts.
 */
export default async function healthRoutes(app: FastifyInstance) {
  // Liveness: "el proceso está vivo". No toca la base; responde siempre que el servidor corra.
  // Una ruta = método + ruta + función (handler). Lo que devuelve el handler se envía como JSON.
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // Readiness: "estoy listo para atender": comprueba que base de datos y Redis responden.
  // Cada servicio se comprueba por separado, para saber cuál falla.
  app.get('/health/ready', async (_request, reply) => {
    const [database, redisStatus] = await Promise.all([
      check(() => pool.query('select 1')), // consulta mínima: si responde, la conexión funciona
      check(() => redis.ping()),
    ]);

    const ok = database === 'up' && redisStatus === 'up';

    if (!ok) {
      app.log.warn({ database, redis: redisStatus }, 'Readiness fallida');
      // 503 = servicio no disponible.
      return reply.code(503).send({ status: 'error', database, redis: redisStatus });
    }

    return { status: 'ok', database, redis: redisStatus };
  });
}
