import '@fastify/cookie'; // carga los tipos de reply.setCookie / request.cookies
import type { FastifyReply } from 'fastify';
import { env } from '../../config/env';

export const REFRESH_COOKIE = 'refresh_token';

// Opciones que protegen la cookie del refresh token (TRD):
const cookieOptions = {
  httpOnly: true, // JavaScript del navegador NO puede leerla (protege contra XSS)
  secure: env.NODE_ENV === 'production', // solo por HTTPS en producción (en localhost no hay HTTPS)
  sameSite: 'strict' as const, // no se envía en peticiones originadas desde otros sitios
  path: '/api/v1/auth', // el navegador solo la manda a las rutas de auth, no a toda la API
};

export function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60, // en segundos
  });
}

export function clearRefreshCookie(reply: FastifyReply) {
  // Para borrar una cookie hay que usar las mismas opciones (sobre todo `path`).
  reply.clearCookie(REFRESH_COOKIE, cookieOptions);
}
