// IMPORTANTE: este import va primero. Carga y valida el .env antes de que
// cualquier otro módulo (como la conexión a la base) lea las variables.
import { env } from './config/env';
import { buildApp } from './app';

const app = buildApp();

async function start() {
  try {
    // host 0.0.0.0: acepta conexiones desde fuera del contenedor/equipo (necesario en Docker).
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

// Cierre ordenado: al recibir Ctrl+C (SIGINT) o la orden de apagado (SIGTERM),
// se termina de atender lo pendiente y se cierran las conexiones.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    app.log.info(`Recibido ${signal}, cerrando servidor…`);
    await app.close();
    process.exit(0);
  });
}

start();
