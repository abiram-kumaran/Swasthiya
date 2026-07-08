import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dispatchTable, centersTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListDispatchQueryParams,
  CreateDispatchBody,
  UpdateDispatchParams,
  UpdateDispatchBody,
  ListDispatchResponse,
  CreateDispatchResponse,
  UpdateDispatchResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildRoute(
  route: typeof dispatchTable.$inferSelect,
  centers: typeof centersTable.$inferSelect[]
) {
  const from = centers.find((c) => c.id === route.fromCenterId);
  const to = centers.find((c) => c.id === route.toCenterId);
  return {
    ...route,
    fromCenterName: from?.name ?? "Unknown",
    toCenterName: to?.name ?? "Unknown",
  };
}

router.get("/dispatch", async (req, res): Promise<void> => {
  const params = ListDispatchQueryParams.safeParse(req.query);
  let query = db.select().from(dispatchTable).$dynamic();

  if (params.success && params.data.status) {
    query = query.where(eq(dispatchTable.status, params.data.status));
  }

  const routes = await query.orderBy(dispatchTable.createdAt);
  const centers = await db.select().from(centersTable);
  const result = routes.map((r) => buildRoute(r, centers));
  res.json(ListDispatchResponse.parse(serializeDates(result)));
});

router.post("/dispatch", async (req, res): Promise<void> => {
  const body = CreateDispatchBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [route] = await db.insert(dispatchTable).values(body.data).returning();
  const centers = await db.select().from(centersTable);
  const result = buildRoute(route, centers);
  res.status(201).json(CreateDispatchResponse.parse(serializeDates(result)));
});

router.patch("/dispatch/:id", async (req, res): Promise<void> => {
  const params = UpdateDispatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateDispatchBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [route] = await db
    .update(dispatchTable)
    .set(body.data)
    .where(eq(dispatchTable.id, params.data.id))
    .returning();

  if (!route) {
    res.status(404).json({ error: "Dispatch route not found" });
    return;
  }

  const centers = await db.select().from(centersTable);
  const result = buildRoute(route, centers);
  res.json(UpdateDispatchResponse.parse(serializeDates(result)));
});

export default router;
