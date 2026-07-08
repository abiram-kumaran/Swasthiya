import { pgTable, serial, integer, text, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const logsTable = pgTable("logs_daily", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  patientFootfall: integer("patient_footfall").notNull().default(0),
  doctorsPresent: integer("doctors_present").notNull().default(0),
  aiAnomalyFlag: boolean("ai_anomaly_flag").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLogSchema = createInsertSchema(logsTable).omit({ id: true, createdAt: true });
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logsTable.$inferSelect;
