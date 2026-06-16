import {
  boolean,
  pgTable,
  uuid,
} from "drizzle-orm/pg-core";
import {usersTable} from "./user"

export const integratedToolsTable = pgTable("integrated_tools", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id, {
      onDelete: "cascade",
    }),

  gmail: boolean("gmail").notNull().default(false),

  googlecalendar: boolean("googlecalendar")
    .notNull()
    .default(false),
});

export type SelectIntegratedTool = typeof integratedToolsTable.$inferSelect;
export type  InsertIntegratedTool = typeof integratedToolsTable.$inferInsert;