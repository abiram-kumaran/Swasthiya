import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, attendanceTable, centersTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListAttendanceQueryParams,
  LogAttendanceBody,
  ListAttendanceResponse,
  LogAttendanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildRecord(
  record: typeof attendanceTable.$inferSelect,
  centers: typeof centersTable.$inferSelect[]
) {
  const center = centers.find((c) => c.id === record.centerId);
  return { ...record, centerName: center?.name ?? "Unknown" };
}

router.get("/attendance", async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  let query = db.select().from(attendanceTable).$dynamic();

  const conditions = [];
  if (params.success && params.data.centerId != null) {
    conditions.push(eq(attendanceTable.centerId, params.data.centerId));
  }
  if (params.success && params.data.date) {
    conditions.push(eq(attendanceTable.date, params.data.date));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const records = await query.orderBy(attendanceTable.createdAt);
  const centers = await db.select().from(centersTable);
  const result = records.map((r) => buildRecord(r, centers));
  res.json(ListAttendanceResponse.parse(serializeDates(result)));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const body = LogAttendanceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const now = new Date();
  const checkInTime = now.toTimeString().slice(0, 5);

  const [record] = await db
    .insert(attendanceTable)
    .values({ ...body.data, checkInTime, present: true })
    .returning();

  const [center] = await db.select().from(centersTable).where(eq(centersTable.id, body.data.centerId));
  if (center) {
    await db
      .update(centersTable)
      .set({ doctorsPresent: center.doctorsPresent + 1 })
      .where(eq(centersTable.id, body.data.centerId));
  }

  const centers = await db.select().from(centersTable);
  const result = buildRecord(record, centers);
  res.status(201).json(LogAttendanceResponse.parse(serializeDates(result)));
});

export default router;
