import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dispatchTable = pgTable("dispatch_routes", {
  id: serial("id").primaryKey(),
  fromCenterId: integer("from_center_id").notNull(),
  toCenterId: integer("to_center_id").notNull(),
  driverName: text("driver_name"),
  payload: text("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending | in_transit | completed | cancelled
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDispatchSchema = createInsertSchema(dispatchTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type Dispatch = typeof dispatchTable.$inferSelect;
