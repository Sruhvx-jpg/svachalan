import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const planTypeEnum = pgEnum("plan_type", [
  "free",
  "monthly",
  "yearly",
  "lifetime",
]);

export const marketplaceProductsTable = pgTable(
  "marketplace_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    toolKey: varchar("tool_key", {length: 255,}).notNull().unique(),

    name: varchar("name", {length: 255,}).notNull(),

    description: text("description"),

    planType: planTypeEnum("plan_type").notNull(),

    priceInPaise: integer("price_in_paise").notNull().default(0),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
)

export type SelectMarketplaceProduct = typeof marketplaceProductsTable.$inferSelect;
export type InsertMarketplaceProduct = typeof marketplaceProductsTable.$inferInsert;