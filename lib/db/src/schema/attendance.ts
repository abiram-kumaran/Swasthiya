import { pgTable, serial, integer, text, date, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  checkInTime: text("check_in_time").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  present: boolean("present").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
