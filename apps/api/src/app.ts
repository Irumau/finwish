import Fastify, { FastifyError } from "fastify";
import { pool } from "@finwish/database";
import { env } from "./config/env";

import rateLimit from "@fastify/rate-limit";

import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import cors from '@fastify/cors';





import { redis } from "./config/redis";
import healthRoutes from "./modules/health/health.routes";
import userRoutes from "./modules/users/users.routes";
import authRoutes from "./modules/auth/auth.routes";

/**
 * buildApp() crea y configura la app SIN ponerla a escuchar en un puerto.
 * Separar "construir" de "arrancar" permite probarla sin red con app.inject()
 * (se simula una petición HTTP en memoria) y reutilizarla en los tests.
 */

const prefix = "/api/v1";


export function buildApp() {
  const app = Fastify({
    // Logs en JSON (pino). En test se silencian.
    logger:
      env.NODE_ENV === "test"
        ? false
        : { level: env.NODE_ENV === "production" ? "info" : "debug" },
  });

  // Hook "onClose": Fastify lo ejecuta al llamar app.close(). Lo usamos para cerrar
  // ordenadamente el pool de conexiones a la base cuando el servidor se apaga.
  app.addHook("onClose", async () => {
    await pool.end();
    await redis.quit();
  });

  // Error handler global: cualquier error no manejado en un handler llega aquí.
  app.setErrorHandler((error : FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;

    if (status >= 500) {
      request.log.error(error);
      return reply.code(500).send({ message: "Error interno del servidor" });
    }

    // Error del cliente (4xx): se devuelve tal cual, sin el stack
    return reply.code(status).send({ message: error.message });
  });

  



  app.register(cors, {
    origin: env.WEB_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
  app.register(fastifyCookie);


  app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.ACCESS_TOKEN_TTL },
  });
  app.register(rateLimit, {
  global: true,          // límite general para todas las rutas
  max: 100,
  timeWindow: "1 minute",
  redis,                 // tu cliente ioredis: el contador queda en Redis
  skipOnError: true,     // si Redis cae, la API sigue atendiendo
});

  // register(plugin, opciones): monta un plugin. Con `prefix`, todas sus rutas
  // quedan bajo ese prefijo: GET /api/v1/health, GET /api/v1/health/ready, etc.
  app.register(healthRoutes, { prefix });
  app.register(userRoutes, { prefix });
  app.register(authRoutes, { prefix });

 


  // Plugins base: deben registrarse ANTES que las rutas que los usan.
   // Aquí iremos registrando más plugins: cors, rate-limit, finance, wishlist…

  return app;
}
