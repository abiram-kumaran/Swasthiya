import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, inventoryTable, centersTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListInventoryQueryParams,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
  ScanInventoryBody,
  ListInventoryResponse,
  GetInventoryAlertsResponse,
  ScanInventoryResponse,
  UpdateInventoryItemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeStatus(quantity: number, dailyBurnRate: number): string {
  const days = dailyBurnRate > 0 ? quantity / dailyBurnRate : Infinity;
  if (quantity <= 10 || days <= 2) return "critical";
  if (days <= 7) return "low";
  if (quantity >= 2000) return "surplus";
  return "ok";
}

function buildItem(
  item: typeof inventoryTable.$inferSelect,
  centers: typeof centersTable.$inferSelect[]
) {
  const center = centers.find((c) => c.id === item.centerId);
  const daysRemaining =
    item.dailyBurnRate > 0 ? item.quantity / item.dailyBurnRate : null;
  return {
    ...item,
    centerName: center?.name ?? "Unknown",
    status: computeStatus(item.quantity, item.dailyBurnRate),
    daysRemaining,
  };
}

router.get("/inventory", async (req, res): Promise<void> => {
  const params = ListInventoryQueryParams.safeParse(req.query);
  const items = await db.select().from(inventoryTable).orderBy(inventoryTable.id);
  const centers = await db.select().from(centersTable);

  const filtered =
    params.success && params.data.centerId != null
      ? items.filter((i) => i.centerId === params.data.centerId)
      : items;

  const result = filtered.map((i) => buildItem(i, centers));
  res.json(ListInventoryResponse.parse(serializeDates(result)));
});

router.get("/inventory/alerts", async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable);
  const centers = await db.select().from(centersTable);

  const alerts = items
    .map((item) => {
      const center = centers.find((c) => c.id === item.centerId);
      const daysRemaining =
        item.dailyBurnRate > 0 ? item.quantity / item.dailyBurnRate : 999;
      const status = computeStatus(item.quantity, item.dailyBurnRate);
      if (status !== "critical" && status !== "low") return null;
      return {
        inventoryItemId: item.id,
        centerId: item.centerId,
        centerName: center?.name ?? "Unknown",
        medicineName: item.medicineName,
        quantity: item.quantity,
        daysRemaining,
        severity: status === "critical" ? "critical" : "low",
      };
    })
    .filter(Boolean);

  res.json(GetInventoryAlertsResponse.parse(serializeDates(alerts)));
});

router.post("/inventory/scan", async (req, res): Promise<void> => {
  const body = ScanInventoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { centerId, imageText, quantity } = body.data;
  const medicineName = imageText.trim() || "Unknown Medicine";
  const qty = quantity ?? 100;

  const existing = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.centerId, centerId));

  const match = existing.find(
    (i) =>
      i.medicineName.toLowerCase().includes(medicineName.toLowerCase()) ||
      medicineName.toLowerCase().includes(i.medicineName.toLowerCase())
  );

  let item;
  if (match) {
    [item] = await db
      .update(inventoryTable)
      .set({ quantity: match.quantity + qty })
      .where(eq(inventoryTable.id, match.id))
      .returning();
  } else {
    [item] = await db
      .insert(inventoryTable)
      .values({ centerId, medicineName, quantity: qty, dailyBurnRate: 10 })
      .returning();
  }

  const centers = await db.select().from(centersTable);
  const result = buildItem(item, centers);
  res.json(ScanInventoryResponse.parse(serializeDates(result)));
});

router.patch("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateInventoryItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [item] = await db
    .update(inventoryTable)
    .set(body.data)
    .where(eq(inventoryTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const centers = await db.select().from(centersTable);
  const result = buildItem(item, centers);
  res.json(UpdateInventoryItemResponse.parse(serializeDates(result)));
});

export default router;
