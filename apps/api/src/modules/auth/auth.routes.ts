import type { FastifyInstance } from "fastify";
import { db, users } from "@finwish/database";
import { eq } from "drizzle-orm";
import { createUserSchema, loginUserSchema } from "@finwish/shared-types";
import argon2 from "argon2";

import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  setRefreshCookie,
} from "./auth.cookies";
import {
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./tokens.service";
import { toPublicUser } from "../users/users.mapper";
import { isUniqueViolation } from "../../lib/db-errors";
import {
  clearFailedLogins,
  isLoginBlocked,
  registerFailedLogin,
} from "./login-attempts.service";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/register",
    { config: { rateLimit: { max: 3, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const result = createUserSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({ details: result.error.issues });
      }

      
      try {
        const {
          email,
          password,
          firstName,
          lastName,
          currencyCode,
          countryCode,
        } = result.data;

        const passwordHash = await argon2.hash(password);

        const [newUser] = await db
          .insert(users)
          .values({
            email: email,
            passwordHash: passwordHash,
            firstName: firstName,
            lastName: lastName,
            currencyCode: currencyCode,
            countryCode: countryCode,
          })
          .returning();

        if (!newUser) throw new Error("No se pudo crear el usuario");

        const userResponse = toPublicUser(newUser);

        return reply.code(201).send({
          message: "Usuario registrado exitosamente",
          user: userResponse,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          return reply
            .code(409)
            .send({ message: "El correo ya está registrado" });
        }
        throw error; // cualquier otro error lo maneja Fastify como 500
      }
    },
  );

  // Login: se valida email y password, y si son correctos se devuelve un access token (JWT) y el usuario.
  const DUMMY_HASH = await argon2.hash("contraseña-falsa"); // para evitar ataques de timing cuando el email no existe
  app.post(
    "/auth/login",
    {
      config: { rateLimit: { max: 10, timeWindow: "2 minute" } },
    },
    async (request, reply) => {
      const result = loginUserSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({ details: result.error.issues });
      }
      const { email, password } = result.data;

      if (await isLoginBlocked(email)) {
        return reply
          .code(429)
          .send({
            message: "Demasiados intentos. Inténtalo de nuevo más tarde",
          });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        await argon2.verify(DUMMY_HASH, password);
        await registerFailedLogin(email);
        return reply.code(401).send({ message: "Credenciales inválidas" });
      }

      const passwordMatches = await argon2.verify(user.passwordHash, password);

      if (!passwordMatches) {
        await registerFailedLogin(email);
        return reply.code(401).send({ message: "Credenciales inválidas" });
      }

      const userResponse = toPublicUser(user);
      //Si paso todo los if el login fue correcto
      // usamos clearFailedLogins para limpiar los tries de logeo fallidos

      await clearFailedLogins(email);

      const accessToken = app.jwt.sign({ sub: user.id });
      const refreshToken = await createRefreshToken(user.id);
      setRefreshCookie(reply, refreshToken);

      return reply.send({
        message: "Login exitoso",
        user: userResponse,
        accessToken: accessToken,
      });
    },
  );

  // Refresh: rota el refresh token (el viejo deja de servir) y devuelve un nuevo access token.
  app.post(
    "/auth/refresh",
    {
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const token = request.cookies[REFRESH_COOKIE]; // lo lee @fastify/cookie

      if (!token) {
        return reply.code(401).send({ message: "Sesión no válida" });
      }

      const rotated = await rotateRefreshToken(token);
      if (!rotated) {
        // Token inexistente, ya usado o caducado: limpiamos la cookie y pedimos iniciar sesión.
        clearRefreshCookie(reply);
        return reply.code(401).send({ message: "Sesión no válida" });
      }

      setRefreshCookie(reply, rotated.newToken);
      const accessToken = app.jwt.sign({ sub: rotated.userId });
      return { accessToken };
    },
  );

  app.post("/auth/logout", async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE]; //lee el token

    if (token) {
      await revokeRefreshToken(token);
    }

    clearRefreshCookie(reply);
    return reply.code(204).send();
  });
}
