import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, centersTable } from "@workspace/db";
import {
  GetCenterParams,
  UpdateCenterParams,
  UpdateCenterBody,
  GetCenterResponse,
  ListCentersResponse,
  GetCentersSummaryResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/centers", async (_req, res): Promise<void> => {
  const centers = await db.select().from(centersTable).orderBy(centersTable.id);
  res.json(ListCentersResponse.parse(serializeDates(centers)));
});

router.get("/centers/summary", async (_req, res): Promise<void> => {
  const centers = await db.select().from(centersTable);
  const summary = {
    totalBeds: centers.reduce((s, c) => s + c.bedCapacity, 0),
    activeBeds: centers.reduce((s, c) => s + c.activeBeds, 0),
    activeStaff: centers.reduce((s, c) => s + c.doctorsPresent, 0),
    criticalShortages: centers.filter((c) => c.status === "critical").length,
    pendingAiActions: centers.filter((c) => c.status === "critical" || c.status === "warning").length,
    totalCenters: centers.length,
    criticalCenters: centers.filter((c) => c.status === "critical").length,
  };
  res.json(GetCentersSummaryResponse.parse(serializeDates(summary)));
});

router.get("/centers/:id", async (req, res): Promise<void> => {
  const params = GetCenterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [center] = await db.select().from(centersTable).where(eq(centersTable.id, params.data.id));
  if (!center) {
    res.status(404).json({ error: "Center not found" });
    return;
  }
  res.json(GetCenterResponse.parse(serializeDates(center)));
});

router.patch("/centers/:id", async (req, res): Promise<void> => {
  const params = UpdateCenterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateCenterBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(centersTable).where(eq(centersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Center not found" });
    return;
  }

  const merged = { ...existing, ...body.data };
  const occupancyRate = merged.activeBeds / merged.bedCapacity;
  const status =
    body.data.status ??
    (occupancyRate >= 0.9 ? "critical" : occupancyRate >= 0.7 ? "warning" : "healthy");

  const [updated] = await db
    .update(centersTable)
    .set({ ...body.data, status })
    .where(eq(centersTable.id, params.data.id))
    .returning();

  res.json(GetCenterResponse.parse(serializeDates(updated)));
});

export default router;
