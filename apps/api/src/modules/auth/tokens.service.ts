import { createHash, randomBytes } from 'node:crypto';
import { redis } from '../../config/redis';
import { env } from '../../config/env';

/**
 * Refresh tokens "opacos" guardados en Redis.
 *
 * - El token es una cadena aleatoria sin información dentro (no es un JWT). Su validez
 *   no está en el token: está en que EXISTA en Redis. Borrarlo = revocarlo al instante.
 * - En Redis guardamos su hash SHA-256, no el token: si alguien viera la base de Redis,
 *   no podría usar los tokens guardados.
 * - Claves:
 *     refresh:<hash>          -> userId            (expira solo a los N días)
 *     user_refresh:<userId>   -> conjunto de hashes (para cerrar todas las sesiones de un usuario)
 */

const TTL_SECONDS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const tokenKey = (hash: string) => `refresh:${hash}`;
const userKey = (userId: string) => `user_refresh:${userId}`;

/** Crea un refresh token nuevo para el usuario y lo registra en Redis. */
export async function createRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url'); // 256 bits aleatorios
  const hash = sha256(token);

  // multi() agrupa los comandos en una transacción: se ejecutan juntos o ninguno.
  await redis
    .multi()
    .set(tokenKey(hash), userId, 'EX', TTL_SECONDS)
    .sadd(userKey(userId), hash)
    .expire(userKey(userId), TTL_SECONDS)
    .exec();

  return token;
}

/**
 * Rotación: consume el token recibido (un solo uso) y emite uno nuevo.
 * Devuelve null si el token no existe, ya se usó o caducó.
 */
export async function rotateRefreshToken(
  token: string,
): Promise<{ userId: string; newToken: string } | null> {
  const hash = sha256(token);

  // GETDEL lee y borra en UN solo paso atómico. Si dos peticiones llegan a la vez con el
  // mismo token, solo una lo obtiene: la otra recibe null. (Un GET y luego un DEL por
  // separado permitiría que ambas pasaran.)
  const userId = await redis.getdel(tokenKey(hash));
  if (!userId) return null;

  await redis.srem(userKey(userId), hash);
  return { userId, newToken: await createRefreshToken(userId) };
}

/** Revoca un solo token (cerrar sesión en este dispositivo). */
export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = sha256(token);
  const userId = await redis.getdel(tokenKey(hash));
  if (userId) await redis.srem(userKey(userId), hash);
}

/** Revoca todos los tokens de un usuario (cerrar sesión en todos los dispositivos). */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  const hashes = await redis.smembers(userKey(userId));
  if (hashes.length > 0) {
    await redis.del(...hashes.map(tokenKey));
  }
  await redis.del(userKey(userId));
}
