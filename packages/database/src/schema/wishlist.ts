import {
  pgTable, uuid, text, varchar, numeric, date, timestamp, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { products } from './products';
import { financialRecords } from './finance';
import { savingsGoals } from './savings-goals';

export type WishlistPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type WishlistStatus = 'SAVING' | 'PURCHASED' | 'ARCHIVED';

/**
 * Tabla `wishlist_items`: el DESEO de un usuario sobre un producto.
 * Une usuario <-> producto: el producto es global (tabla products) y el deseo es personal
 * (prioridad, notas, precio objetivo, fecha meta).
 * Opcionalmente se vincula a UNA meta de ahorro (savings_goals).
 */
export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // RESTRICT: no se puede borrar un producto que alguien tiene en su wishlist.
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    // Meta de ahorro vinculada (opcional). `unique` garantiza UNA meta por ítem:
    // una meta no puede financiar dos ítems a la vez (PostgreSQL permite varios NULL).
    // SET NULL: si se borra la meta, el ítem sigue existiendo, solo queda sin vínculo.
    savingsGoalId: uuid('savings_goal_id')
      .unique()
      .references(() => savingsGoals.id, { onDelete: 'set null' }),
    // Umbral del usuario para las alertas de bajada de precio.
    desiredPrice: numeric('desired_price', { precision: 12, scale: 2 }),
    priority: varchar('priority', { length: 10 }).$type<WishlistPriority>().default('MEDIUM'),
    status: varchar('status', { length: 20 }).$type<WishlistStatus>().default('SAVING'),
    targetDate: date('target_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_wishlist_user_status').on(t.userId, t.status),
    index('idx_wishlist_user_product').on(t.userId, t.productId),
    index('idx_wishlist_user_created').on(t.userId, t.createdAt),
    index('idx_wishlist_user_id').on(t.userId, t.id),
  ],
);

/**
 * Aportes virtuales a una META DE AHORRO ("Gasto evitado", ahorro asignado).
 * La suma de los aportes de una meta es su "saldo asignado", que alimenta el semáforo
 * de compra del ítem vinculado. Opcionalmente se enlaza con el registro financiero que
 * lo originó.
 * (Nombre de tabla conservado del TRD; ahora cuelga de savings_goals, no del ítem.)
 */
export const wishlistContributions = pgTable(
  'wishlist_contributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    savingsGoalId: uuid('savings_goal_id')
      .notNull()
      .references(() => savingsGoals.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // SET NULL: si se borra el registro, el aporte se conserva sin vínculo.
    financialRecordId: uuid('financial_record_id').references(() => financialRecords.id, {
      onDelete: 'set null',
    }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    contributionDate: timestamp('contribution_date', { withTimezone: true }).defaultNow(),
    notes: text('notes'),
  },
  (t) => [
    index('idx_contributions_goal').on(t.savingsGoalId),
    index('idx_contributions_user').on(t.userId),
    index('idx_contributions_user_date').on(t.userId, t.contributionDate),
    index('idx_contributions_user_id').on(t.userId, t.id),
    check('chk_contributions_amount_positive', sql`${t.amount} > 0`),
  ],
);

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
export type WishlistContribution = typeof wishlistContributions.$inferSelect;
export type NewWishlistContribution = typeof wishlistContributions.$inferInsert;
