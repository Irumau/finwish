import {
  pgTable, uuid, text, varchar, numeric, boolean, date, timestamp, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export type RecordType = 'INCOME' | 'EXPENSE';
export type BucketType = 'FIXED' | 'VARIABLE' | 'SAVING';

/**
 * Registros financieros: ingresos y gastos que el usuario anota a mano (informativos,
 * no mueven dinero real). Guarda el monto original Y el convertido a la moneda base,
 * junto con la tasa usada ("historial congelado"): si la tasa cambia mañana,
 * los registros viejos no se alteran.
 */
export const financialRecords = pgTable(
  'financial_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // user_id: cada fila pertenece a un usuario. Si se borra el usuario, se borran sus filas.
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // en moneda base
    originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
    originalCurrency: varchar('original_currency', { length: 3 }).notNull(),
    exchangeRateUsed: numeric('exchange_rate_used', { precision: 16, scale: 6 })
      .notNull()
      .default('1.000000'),
    type: varchar('type', { length: 10 }).$type<RecordType>().notNull(),
    bucketType: varchar('bucket_type', { length: 20 })
      .$type<BucketType>()
      .notNull()
      .default('VARIABLE'),
    category: varchar('category', { length: 50 }).notNull(),
    description: text('description'),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_financial_records_user_date').on(t.userId, t.transactionDate.desc()),
    // Índices que el TRD marca como obligatorios para tablas con user_id.
    index('idx_financial_records_user_created').on(t.userId, t.createdAt),
    index('idx_financial_records_user_id').on(t.userId, t.id),
    // Regla del TRD: el monto es siempre mayor a 0 (el signo lo da `type`).
    check('chk_financial_records_amount_positive', sql`${t.amount} > 0`),
  ],
);

/**
 * Presupuestos por categoría y período. `isSoftLimit` = tope blando: superarlo
 * no bloquea nada, solo recalcula el Disponible real. `rolloverUnused` = arrastrar sobrante.
 */
export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 50 }).notNull(),
    limitAmount: numeric('limit_amount', { precision: 12, scale: 2 }).notNull(),
    isSoftLimit: boolean('is_soft_limit').notNull().default(true),
    rolloverUnused: boolean('rollover_unused').notNull().default(false),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_budgets_user_period').on(t.userId, t.periodStart, t.periodEnd),
    index('idx_budgets_user_created').on(t.userId, t.createdAt),
    index('idx_budgets_user_id').on(t.userId, t.id),
  ],
);

export type FinancialRecord = typeof financialRecords.$inferSelect;
export type NewFinancialRecord = typeof financialRecords.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
