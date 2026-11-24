import Fastify from 'fastify';
import { pool } from '@finwish/database';
import { env } from './config/env';
import healthRoutes from './modules/health/health.routes';
import userRoutes from './modules/users/users.routes';

/**
 * buildApp() crea y configura la app SIN ponerla a escuchar en un puerto.
 * Separar "construir" de "arrancar" permite probarla sin red con app.inject()
 * (se simula una petición HTTP en memoria) y reutilizarla en los tests.
 */

const prefix = '/api/v1/';
export function buildApp() {
  const app = Fastify({
    // Logs en JSON (pino). En test se silencian.
    logger: env.NODE_ENV === 'test' ? false : { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  // Hook "onClose": Fastify lo ejecuta al llamar app.close(). Lo usamos para cerrar
  // ordenadamente el pool de conexiones a la base cuando el servidor se apaga.
  app.addHook('onClose', async () => {
    await pool.end();
  });

  // register(plugin, opciones): monta un plugin. Con `prefix`, todas sus rutas
  // quedan bajo ese prefijo: GET /api/v1/health, GET /api/v1/health/ready.
  app.register(healthRoutes, { prefix: prefix });

  // Aquí iremos registrando más plugins: cors, cookies, auth, finance, wishlist…

  app.register(userRoutes, { prefix: prefix });
  return app;
}
