import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  fullName: varchar("full_name", { length: 255, }).notNull(),

  email: varchar("email", { length: 255, }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),

  password: varchar("password", { length: 255 }).notNull(),

  profileImageUrl: text("profile_image_url"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).notNull().defaultNow(),


  connectedTools: text("connected_tools")
    .array()
    .notNull()
    .default([]),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;