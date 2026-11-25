import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';

// Le decimos a TypeScript qué lleva dentro nuestro access token:
// `sub` ("subject") es el id del usuario. Así request.user.sub tiene tipo string.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

/**
 * Hook "preHandler" para proteger rutas. Se usa así:
 *
 *   app.get('/users/me', { preHandler: authenticate }, async (request) => {
 *     const userId = request.user.sub; // id del usuario autenticado
 *   });
 *
 * jwtVerify() lee el header "Authorization: Bearer <token>", comprueba la firma y la
 * caducidad, y deja el contenido en request.user. Si algo falla, respondemos 401.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ message: 'No autorizado' });
  }
}
