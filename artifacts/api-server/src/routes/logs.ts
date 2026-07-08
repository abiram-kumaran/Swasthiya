import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, logsTable, centersTable, inventoryTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListLogsQueryParams,
  CreateLogBody,
  ProcessVoiceLogBody,
  ListLogsResponse,
  CreateLogResponse,
  ProcessVoiceLogResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildLog(
  log: typeof logsTable.$inferSelect,
  centers: typeof centersTable.$inferSelect[]
) {
  const center = centers.find((c) => c.id === log.centerId);
  return { ...log, centerName: center?.name ?? "Unknown" };
}

router.get("/logs", async (req, res): Promise<void> => {
  const params = ListLogsQueryParams.safeParse(req.query);
  let query = db.select().from(logsTable).$dynamic();

  const conditions = [];
  if (params.success && params.data.centerId != null) {
    conditions.push(eq(logsTable.centerId, params.data.centerId));
  }
  if (params.success && params.data.date) {
    conditions.push(eq(logsTable.date, params.data.date));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const logs = await query.orderBy(logsTable.date);
  const centers = await db.select().from(centersTable);
  const result = logs.map((l) => buildLog(l, centers));
  res.json(ListLogsResponse.parse(serializeDates(result)));
});

router.post("/logs", async (req, res): Promise<void> => {
  const body = CreateLogBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [log] = await db.insert(logsTable).values(body.data).returning();
  const centers = await db.select().from(centersTable);
  const result = buildLog(log, centers);
  res.status(201).json(CreateLogResponse.parse(serializeDates(result)));
});

router.post("/logs/voice", async (req, res): Promise<void> => {
  const body = ProcessVoiceLogBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const transcript = body.data.transcript.toLowerCase();

  let patientFootfall: number | null = null;
  const footfallMatch = transcript.match(/(\d+)\s*(patients|people|visitors)/);
  if (footfallMatch) patientFootfall = parseInt(footfallMatch[1], 10);

  let medicineName: string | null = null;
  let stockStatus: string | null = null;
  const meds = ["paracetamol", "amoxicillin", "ibuprofen", "aspirin", "metformin", "insulin", "ors", "azithromycin"];
  for (const med of meds) {
    if (transcript.includes(med)) {
      medicineName = med.charAt(0).toUpperCase() + med.slice(1);
      if (transcript.includes("out of") || transcript.includes("no stock") || transcript.includes("finished")) {
        stockStatus = "critical";
      } else if (transcript.includes("low") || transcript.includes("running out")) {
        stockStatus = "low";
      } else if (transcript.includes("surplus") || transcript.includes("plenty")) {
        stockStatus = "surplus";
      }
      break;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const [center] = await db.select().from(centersTable).where(eq(centersTable.id, body.data.centerId));

  const [log] = await db
    .insert(logsTable)
    .values({
      centerId: body.data.centerId,
      date: today,
      patientFootfall: patientFootfall ?? 0,
      doctorsPresent: center?.doctorsPresent ?? 0,
      aiAnomalyFlag: patientFootfall != null && patientFootfall > 80,
      notes: `Voice log: ${body.data.transcript}`,
    })
    .returning();

  if (medicineName && stockStatus === "critical") {
    const items = await db.select().from(inventoryTable).where(eq(inventoryTable.centerId, body.data.centerId));
    const match = items.find((i) => i.medicineName.toLowerCase().includes(medicineName!.toLowerCase()));
    if (match) {
      await db.update(inventoryTable).set({ quantity: 5 }).where(eq(inventoryTable.id, match.id));
    }
  }

  const centers = await db.select().from(centersTable);
  const built = buildLog(log, centers);

  const messageParts = [
    patientFootfall != null ? `Recorded ${patientFootfall} patients for ${center?.name}.` : "",
    medicineName ? `${medicineName} stock marked as ${stockStatus ?? "noted"}.` : "",
    patientFootfall != null && patientFootfall > 80 ? "High footfall anomaly flagged for AI review." : "",
  ].filter(Boolean);

  res.json(
    ProcessVoiceLogResponse.parse(serializeDates({
      parsed: { patientFootfall, medicineName, stockStatus },
      log: built,
      message: messageParts.join(" ") || "Voice log recorded successfully.",
    }))
  );
});

export default router;
