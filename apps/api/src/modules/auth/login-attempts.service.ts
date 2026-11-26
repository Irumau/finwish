import { redis } from "../../config/redis";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;
const key = (email: string) => `login_fail:${email}`;

/** ¿Este email superó el máximo de intentos fallidos? */
export async function isLoginBlocked(email: string): Promise<boolean> {
  const attempts = Number(await redis.get(key(email))); // si no existe, get da null y Number(null) es 0
  return attempts >= MAX_ATTEMPTS;
}

/** Suma un intento fallido. La caducidad se fija solo si la clave no tenía una. */
export async function registerFailedLogin(email: string): Promise<void> {
  await redis.incr(key(email));

  // por si typescript se queja 
  /* 
    const n = await redis.incr(k); if (n === 1) await redis.expire(k, WINDOW_SECONDS)
  */
  await redis.expire(key(email), WINDOW_SECONDS, "NX");
}

/** Login correcto: se borra el contador. */
export async function clearFailedLogins(email: string): Promise<void> {
  await redis.del(key(email));
}