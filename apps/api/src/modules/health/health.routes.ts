import type { FastifyInstance } from 'fastify';
import { pool } from '@finwish/database';

/**
 * Un "plugin" de Fastify es una función async que recibe la instancia de la app
 * y le agrega cosas (rutas, hooks, decoradores). Así se organiza todo en Fastify:
 * cada módulo (auth, finance, wishlist…) será un plugin que se registra en app.ts.
 */
export default async function healthRoutes(app: FastifyInstance) {
  // Liveness: "el proceso está vivo". No toca la base; responde siempre que el servidor corra.
  // Una ruta = método + ruta + función (handler). Lo que devuelve el handler se envía como JSON.
  app.get('health', async () => {
    return { status: 'ok' };
  });

  // Readiness: "estoy listo para atender": comprueba que la base de datos responde.
  app.get('health/ready', async (_request, reply) => {
    try {
      await pool.query('select 1'); // consulta mínima: si responde, la conexión funciona
      return { status: 'ok', database: 'up' };
    } catch (error) {
      app.log.error(error); // app.log es el logger integrado (pino)
      // reply.code(...) fija el estado HTTP. 503 = servicio no disponible.
      return reply.code(503).send({ status: 'error', database: 'down' });
    }
  });
}
