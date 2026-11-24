import {
  pgTable, uuid, varchar, numeric, date, timestamp, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export type SavingsGoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/**
 * Tabla `savings_goals`: el "fondo" de ahorro virtual de una meta.
 * - Es una entidad propia: puede existir sin producto (ej. "Fondo de emergencia")
 *   o estar vinculada a un ítem de la wishlist (relación 1 meta ↔ 1 ítem, ver wishlist.ts).
 * - Su saldo NO se guarda: es la suma de sus aportes (wishlist_contributions).
 *   Así el saldo nunca queda desactualizado respecto a los aportes.
 * - La fecha estimada de cumplimiento tampoco se guarda: se calcula con el ritmo de aportes.
 */
export const savingsGoals = pgTable(
  'savings_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    // Monto a alcanzar, en la moneda base del usuario.
    targetAmount: numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
    // Fecha objetivo opcional que el usuario puede fijar.
    targetDate: date('target_date'),
    status: varchar('status', { length: 20 })
      .$type<SavingsGoalStatus>()
      .notNull()
      .default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_savings_goals_user_status').on(t.userId, t.status),
    index('idx_savings_goals_user_created').on(t.userId, t.createdAt),
    index('idx_savings_goals_user_id').on(t.userId, t.id),
    check('chk_savings_goals_target_positive', sql`${t.targetAmount} > 0`),
  ],
);

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
