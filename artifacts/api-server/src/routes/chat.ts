import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatMessagesTable, centersTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListChatMessagesQueryParams,
  SendChatMessageBody,
  ListChatMessagesResponse,
  SendChatMessageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SESSION_DEFAULT = "demo-session";

function generateBotReply(
  content: string,
  centers: typeof centersTable.$inferSelect[]
): { reply: string; isAlert: boolean } {
  const lower = content.toLowerCase();

  if (
    lower.includes("chest pain") ||
    lower.includes("heart attack") ||
    lower.includes("stroke") ||
    lower.includes("unconscious") ||
    lower.includes("not breathing")
  ) {
    return {
      reply:
        "CRITICAL ALERT: Your symptoms require immediate emergency care. Alerting frontline staff now. Please call 108 (ambulance) immediately. Do NOT wait in any queue.",
      isAlert: true,
    };
  }

  if (lower.includes("crowd") || lower.includes("wait") || lower.includes("queue") || lower.includes("check")) {
    const healthy = centers.filter((c) => c.status === "healthy");
    if (lower.includes("alpha") || lower.includes("phc-alpha") || lower.includes("phc alpha")) {
      const alpha = centers.find(
        (c) => c.name.toLowerCase().includes("alpha") || c.name.toLowerCase().includes("phc-alpha")
      );
      if (alpha) {
        const wait = alpha.waitTimeMinutes ?? 150;
        const bedsAvail = alpha.bedCapacity - alpha.activeBeds;
        const nearby = healthy[0];
        return {
          reply: `PHC-Alpha has a ${Math.round((wait / 60) * 10) / 10}-hour wait. ${bedsAvail <= 0 ? "Beds are full." : `${bedsAvail} beds available.`}${nearby ? ` Recommend ${nearby.name} (approx. 10-15 min wait).` : ""}`,
          isAlert: false,
        };
      }
      return {
        reply:
          "PHC-Alpha is operating at high capacity with a 2.5-hour wait. Beds are full. We recommend CHC-Central (10 mins away, ~15-min wait).",
        isAlert: false,
      };
    }
    const summary = centers
      .map((c) => `${c.name}: ${c.waitTimeMinutes ?? "N/A"} min wait`)
      .join(". ");
    return {
      reply: `Current wait times across district: ${summary}. Avoid critical-status centers if possible.`,
      isAlert: false,
    };
  }

  if (lower.includes("fever") || lower.includes("headache") || lower.includes("cold") || lower.includes("cough")) {
    const available = centers.find((c) => c.status === "healthy");
    return {
      reply: `For mild symptoms, visit ${available?.name ?? "your nearest PHC"}. Expected wait: ${available?.waitTimeMinutes ?? 20} minutes. Bring your health card.`,
      isAlert: false,
    };
  }

  if (lower.includes("dehydration") || lower.includes("vomiting") || lower.includes("diarrhea")) {
    return {
      reply:
        "These symptoms can escalate in heat. Please visit PHC-North or CHC-Central today. Drink ORS while traveling. Expected wait at CHC-Central: 20 minutes.",
      isAlert: false,
    };
  }

  if (lower.includes("medicine") || lower.includes("paracetamol") || lower.includes("stock")) {
    return {
      reply:
        "Medicine status: Paracetamol is critically low at PHC-Alpha (5 units). CHC-Central has surplus (5,000 units). A redistribution request is pending admin approval.",
      isAlert: false,
    };
  }

  return {
    reply:
      "Hello! I am CareGrid's health assistant. Ask me about: wait times ('Check crowd at PHC-Alpha'), symptoms ('I have fever'), or medicine availability ('Is Paracetamol available?'). How can I help?",
    isAlert: false,
  };
}

router.get("/chat/messages", async (req, res): Promise<void> => {
  const params = ListChatMessagesQueryParams.safeParse(req.query);
  const sessionId =
    params.success && params.data.sessionId ? params.data.sessionId : SESSION_DEFAULT;

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  res.json(ListChatMessagesResponse.parse(serializeDates(messages)));
});

router.post("/chat/messages", async (req, res): Promise<void> => {
  const body = SendChatMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const centers = await db.select().from(centersTable);

  const [userMessage] = await db
    .insert(chatMessagesTable)
    .values({ sessionId: body.data.sessionId, role: "user", content: body.data.content, isAlert: false })
    .returning();

  const { reply, isAlert } = generateBotReply(body.data.content, centers);

  const [botMessage] = await db
    .insert(chatMessagesTable)
    .values({ sessionId: body.data.sessionId, role: "bot", content: reply, isAlert })
    .returning();

  res.json(SendChatMessageResponse.parse(serializeDates({ userMessage, botMessage, isAlert })));
});

export default router;
