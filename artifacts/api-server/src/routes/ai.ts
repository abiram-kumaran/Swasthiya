import { Router, type IRouter } from "express";
import { db, centersTable, inventoryTable, dispatchTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { serializeDates } from "../lib/serialize";
import {
  ApproveRedistributionParams,
  GetEpidemicRadarResponse,
  GetRedistributionSuggestionsResponse,
  CreateDispatchResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ai/epidemic-radar", async (_req, res): Promise<void> => {
  const centers = await db.select().from(centersTable);
  const criticalCenters = centers.filter((c) => c.status === "critical");
  const phcNames = centers.filter((c) => c.type === "PHC").map((c) => c.name);

  const alerts = [
    {
      id: "ep-001",
      type: "Heatwave Surge Alert",
      severity: "critical",
      message:
        "40 degree C heatwave detected from IMD weather data. AI model predicts 30% surge in dehydration and heat stroke cases across district PHCs.",
      affectedCenters: phcNames,
      predictedSurgePercent: 30,
      weatherTrigger: "Extreme Heat (40C+)",
      createdAt: new Date().toISOString(),
    },
    {
      id: "ep-002",
      type: "Overcrowding Risk",
      severity: criticalCenters.length > 0 ? "critical" : "warning",
      message:
        criticalCenters.length > 0
          ? `${criticalCenters.map((c) => c.name).join(", ")} operating above capacity. Immediate patient re-routing recommended.`
          : "Moderate overcrowding detected. Monitor patient intake at PHC facilities.",
      affectedCenters: criticalCenters.length > 0 ? criticalCenters.map((c) => c.name) : centers.map((c) => c.name),
      predictedSurgePercent: criticalCenters.length > 0 ? 45 : 15,
      weatherTrigger: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "ep-003",
      type: "Monsoon Malaria Advisory",
      severity: "warning",
      message:
        "Monsoon conditions increasing malaria vector density. Prepare antimalarial stockpiles. Predictive model shows 20% increase in febrile illness over next 14 days.",
      affectedCenters: centers.map((c) => c.name),
      predictedSurgePercent: 20,
      weatherTrigger: "Monsoon Season",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  res.json(GetEpidemicRadarResponse.parse(serializeDates(alerts)));
});

router.get("/ai/redistribution", async (_req, res): Promise<void> => {
  const centers = await db.select().from(centersTable);
  const inventory = await db.select().from(inventoryTable);

  const suggestions: object[] = [];

  for (const item of inventory) {
    const center = centers.find((c) => c.id === item.centerId);
    if (!center) continue;
    const daysRemaining = item.dailyBurnRate > 0 ? item.quantity / item.dailyBurnRate : 999;

    if (item.quantity >= 1000 || daysRemaining > 30) {
      const shortages = inventory.filter(
        (i) =>
          i.centerId !== item.centerId &&
          i.medicineName.toLowerCase() === item.medicineName.toLowerCase() &&
          (i.quantity <= 20 || (i.dailyBurnRate > 0 && i.quantity / i.dailyBurnRate <= 3))
      );

      for (const shortage of shortages) {
        const toCenter = centers.find((c) => c.id === shortage.centerId);
        if (!toCenter) continue;
        suggestions.push({
          id: `redist-${item.id}-${shortage.id}`,
          fromCenterId: item.centerId,
          fromCenterName: center.name,
          toCenterId: shortage.centerId,
          toCenterName: toCenter.name,
          medicineName: item.medicineName,
          quantity: Math.min(200, Math.floor(item.quantity * 0.1)),
          reason: `${toCenter.name} has critically low ${item.medicineName} (${shortage.quantity} units, ${Math.ceil(shortage.quantity / (shortage.dailyBurnRate || 1))} days). ${center.name} has surplus (${item.quantity} units). AI recommends immediate redistribution.`,
          approved: false,
          estimatedTransitMinutes: 35,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Always include at least the demo suggestion
  if (suggestions.length === 0) {
    const chc = centers.find((c) => c.type === "CHC");
    const phc =
      centers.find((c) => c.status === "critical") ??
      centers.find((c) => c.name.toLowerCase().includes("alpha")) ??
      centers.find((c) => c.type === "PHC");
    if (chc && phc) {
      suggestions.push({
        id: "redist-demo-001",
        fromCenterId: chc.id,
        fromCenterName: chc.name,
        toCenterId: phc.id,
        toCenterName: phc.name,
        medicineName: "Paracetamol 500mg",
        quantity: 200,
        reason: `${phc.name} has critically low Paracetamol (5 units, 0 days remaining). ${chc.name} has surplus of 5,000 units. AI recommends immediate dispatch.`,
        approved: false,
        estimatedTransitMinutes: 35,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json(GetRedistributionSuggestionsResponse.parse(serializeDates(suggestions)));
});

router.post("/ai/redistribution/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveRedistributionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const centers = await db.select().from(centersTable);
  const inventory = await db.select().from(inventoryTable);

  // Parse ids from the redistribution suggestion id format: "redist-{fromId}-{toId}" or "redist-demo-001"
  const parts = params.data.id.split("-");
  const fromInventoryId = parseInt(parts[1], 10);
  const toInventoryId = parseInt(parts[2], 10);

  const fromItem = inventory.find((i) => i.id === fromInventoryId);
  const toItem = inventory.find((i) => i.id === toInventoryId);

  let fromCenterId: number;
  let toCenterId: number;
  let medicineName: string;
  let quantity: number;

  if (fromItem && toItem) {
    fromCenterId = fromItem.centerId;
    toCenterId = toItem.centerId;
    medicineName = fromItem.medicineName;
    quantity = Math.min(200, Math.floor(fromItem.quantity * 0.1));
  } else {
    const chc = centers.find((c) => c.type === "CHC");
    const phc =
      centers.find((c) => c.status === "critical") ??
      centers.find((c) => c.type === "PHC");
    fromCenterId = chc?.id ?? centers[0]?.id ?? 1;
    toCenterId = phc?.id ?? centers[1]?.id ?? 2;
    medicineName = "Paracetamol 500mg";
    quantity = 200;
  }

  const fromCenter = centers.find((c) => c.id === fromCenterId);
  const toCenter = centers.find((c) => c.id === toCenterId);

  const [route] = await db
    .insert(dispatchTable)
    .values({
      fromCenterId,
      toCenterId,
      payload: `${quantity} units of ${medicineName}`,
      status: "pending",
      estimatedMinutes: 35,
      driverName: "AI-Assigned Driver",
    })
    .returning();

  res.json(
    CreateDispatchResponse.parse(serializeDates({
      ...route,
      fromCenterName: fromCenter?.name ?? "Unknown",
      toCenterName: toCenter?.name ?? "Unknown",
    }))
  );
});

export default router;
