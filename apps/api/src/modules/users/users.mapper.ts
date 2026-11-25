import type { User as UserRow } from "@finwish/database";
import { userSchema } from "@finwish/shared-types";

// Convierte la fila de la base (con passwordHash y fechas Date) en el usuario público:
// userSchema.parse descarta los campos que no están en el schema, y las fechas pasan a ISO string.
export function toPublicUser(user: UserRow) {
  return userSchema.parse({
    ...user,
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
  });
}

