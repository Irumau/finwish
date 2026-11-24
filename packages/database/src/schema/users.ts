import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Tabla `users`: una fila por cuenta. Es la raíz del aislamiento multi-tenant:
 * casi todas las demás tablas apuntan aquí con `user_id`.
 */
export const users = pgTable(
  'users',
  {
    // uuid con valor aleatorio generado por PostgreSQL (gen_random_uuid()).
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    // Moneda base (ISO 4217) y país (ISO 3166): definen conversiones y tiendas prioritarias.
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    countryCode: varchar('country_code', { length: 2 }).notNull().default('US'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('idx_users_email').on(t.email)],
);

export type User = typeof users.$inferSelect; // lo que devuelve un SELECT
export type NewUser = typeof users.$inferInsert; // lo que se necesita para un INSERT
