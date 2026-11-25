import type { FastifyInstance } from "fastify";
import { db, users } from "@finwish/database";
import { eq } from "drizzle-orm";
import { authenticate } from "../auth/authenticate";
import { toPublicUser } from "./users.mapper";
import { isUniqueViolation } from "../../lib/db-errors";
import {
  updateUserSchema,
  changePasswordSchema,
  changeEmailSchema,
} from "@finwish/shared-types";
import argon2 from "argon2";
import { revokeAllUserTokens } from "../auth/tokens.service";

export default async function userRoutes(app: FastifyInstance) {
  // Devuelve el usuario autenticado (identificado por su access token).
  app.get("/users/me", { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user.sub; // id usuario autenticado

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return reply.code(404).send({ message: "Usuario no encontrado" });
    }

    const userResponse = toPublicUser(user);

    return reply.code(200).send({
      user: userResponse,
    });
  });

  app.put(
    "/users/me/email",
    { preHandler: authenticate },
    async (request, reply) => {
      const result = changeEmailSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({ details: result.error.issues });
      }

      const { newEmail, currentPassword } = result.data;

      const userId = request.user.sub;
      const [user] = await db
        .select()
        .from(users)
        .limit(1)
        .where(eq(users.id, userId));

      if (!user) {
        return reply.code(404).send({ message: "Usuario no encontrado" });
      }

      const passwordMatches = await argon2.verify(
        user.passwordHash,
        currentPassword,
      );

      if (!passwordMatches)
        return reply
          .code(401)
          .send({ message: "Contraseña actual incorrecta" });

      if (newEmail === user.email)
        return reply.code(400).send({
          message: "El nuevo correo debe ser distinto",
        });

      try {
        await db
          .update(users)
          .set({
            email: newEmail,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        await revokeAllUserTokens(userId);
        return reply.code(204).send();
      } catch (error) {
        if (isUniqueViolation(error)) {
          return reply
            .code(409)
            .send({ message: "El correo ya está registrado" });
        }
        throw error;
      }
    },
  );

  app.put(
    "/users/me/password",
    { preHandler: authenticate },
    async (request, reply) => {
      const result = changePasswordSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({ details: result.error.issues });
      }

      const { currentPassword, newPassword } = result.data;
      const userId = request.user.sub;

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return reply.code(404).send({ message: "Usuario no encontrado" });
      }

      const passwordMatches = await argon2.verify(
        user.passwordHash,
        currentPassword,
      );

      if (!passwordMatches) {
        return reply
          .code(401)
          .send({ message: "Contraseña actual incorrecta" });
      }

      if (newPassword === currentPassword) {
        return reply.code(400).send({
          message: "La nueva contraseña debe ser distinta de la actual",
        });
      }

      const newPasswordHash = await argon2.hash(newPassword);

      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      await revokeAllUserTokens(userId);
      return reply.code(204).send();
    },
  );

  app.patch(
    "/users/me",
    { preHandler: authenticate },
    async (request, reply) => {
      const result = updateUserSchema.safeParse(request.body);

      if (!result.success)
        return reply.code(400).send({ details: result.error.issues });

      const userId = request.user.sub;

      const [updates] = await db
        .update(users)
        .set({
          ...result.data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updates) {
        return reply.code(404).send({ message: "Usuario no encontrado" });
      }

      return reply
        .code(200)
        .send({
          message: "Cambios realizados correctamente",
          user: toPublicUser(updates),
        });
    },
  );
}
