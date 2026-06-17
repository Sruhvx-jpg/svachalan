import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean
} from "drizzle-orm/pg-core";

import { usersTable } from "./user";
import { marketplaceProductsTable } from "./marketPlaceProductsTable";

export const userProductsTable = pgTable(
  "user_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id").notNull()
      .references(() => marketplaceProductsTable.id, {
        onDelete: "cascade",
      }),

    startsAt: timestamp("starts_at", {
      withTimezone: true,
    }).notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
);


export const productLicenses = pgTable("product_licenses", {
  id: uuid("id").defaultRandom().primaryKey(),

  userProductId: uuid("user_product_id")
    .notNull()
    .references(() => userProductsTable.id, {
      onDelete: "cascade",
    }),

  licenseKey: text("license_key")
    .notNull()
    .unique(),

  isActive: boolean("is_active")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});


export type SelectUserProduct = typeof userProductsTable.$inferSelect;
export type InsertUserProduct = typeof userProductsTable.$inferInsert;