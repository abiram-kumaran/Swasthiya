import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const centersTable = pgTable("centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("PHC"), // PHC | CHC
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  bedCapacity: integer("bed_capacity").notNull().default(50),
  activeBeds: integer("active_beds").notNull().default(0),
  doctorsPresent: integer("doctors_present").notNull().default(0),
  patientFootfall: integer("patient_footfall").notNull().default(0),
  status: text("status").notNull().default("healthy"), // healthy | warning | critical
  waitTimeMinutes: integer("wait_time_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCenterSchema = createInsertSchema(centersTable).omit({ id: true, createdAt: true });
export type InsertCenter = z.infer<typeof insertCenterSchema>;
export type Center = typeof centersTable.$inferSelect;
