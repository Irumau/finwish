import { pgTable, uuid, varchar, numeric, timestamp, index, unique } from 'drizzle-orm/pg-core';

/**
 * Tasas de cambio sincronizadas por el worker cada 6-12 horas.
 * Se guarda cada lectura (no se sobrescribe) para conservar el historial.
 */
export const exchangeRates = pgTable(
  'exchange_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromCurrency: varchar('from_currency', { length: 3 }).notNull(),
    toCurrency: varchar('to_currency', { length: 3 }).notNull(),
    // 16 dígitos, 6 decimales. En JS llega como string para no perder precisión.
    rate: numeric('rate', { precision: 16, scale: 6 }).notNull(),
    // Proveedor que dio la tasa (ej. 'exchangerate-api', 'dolarapi').
    source: varchar('source', { length: 50 }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('uq_exchange_rate_pair').on(t.fromCurrency, t.toCurrency, t.fetchedAt),
    // Para pedir "la tasa más reciente de A a B" rápido.
    index('idx_exchange_rates_lookup').on(t.fromCurrency, t.toCurrency, t.fetchedAt.desc()),
  ],
);

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;
