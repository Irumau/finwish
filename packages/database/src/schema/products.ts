import {
  pgTable, uuid, text, varchar, char, numeric, timestamp, index,
} from 'drizzle-orm/pg-core';

/** Estados posibles del scraping. Se tipa en TypeScript sin crear un enum en la base. */
export type ScrapeStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'NEEDS_MANUAL_INPUT';

/**
 * Tabla `products`: el producto GLOBAL de una tienda, deduplicado por URL.
 * Si 100 usuarios guardan el mismo enlace, existe UNA sola fila aquí y el worker
 * lo revisa una sola vez. No lleva user_id a propósito (es compartida).
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    // SHA-256 (64 caracteres hex) de la URL normalizada. Es la clave de deduplicación.
    urlHash: char('url_hash', { length: 64 }).notNull().unique(),
    storeName: varchar('store_name', { length: 100 }),
    title: varchar('title', { length: 500 }),
    imageUrl: text('image_url'),
    // Puede ser null si el primer scraping falló.
    currentPrice: numeric('current_price', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('USD'),
    scrapeStatus: varchar('scrape_status', { length: 30 })
      .$type<ScrapeStatus>()
      .notNull()
      .default('PENDING'),
    lastScrapedAt: timestamp('last_scraped_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_products_url_hash').on(t.urlHash),
    // Para que el cron encuentre rápido los productos que toca revisar.
    index('idx_products_scrape_status').on(t.scrapeStatus, t.lastScrapedAt),
  ],
);

/**
 * Historial de precios: un punto por producto y día (lo escribe el worker).
 * Alimenta el gráfico de la tarjeta destacada de la wishlist.
 */
export const productPriceHistory = pgTable(
  'product_price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [index('idx_price_history_product_date').on(t.productId, t.recordedAt.desc())],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductPricePoint = typeof productPriceHistory.$inferSelect;
