import { onCall } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { requireRole, requireString } from "../lib/guards.js";
import { GEMINI_API_KEY } from "../lib/secrets.js";
import { getGateway } from "../ai/index.js";
import type { OpsChatContext, OpsChatTurn } from "../ai/gateway.js";
import type { Lang } from "../domain.js";

/**
 * Operator assistant. Aggregates fan-supplied data for the match and asks the
 * AI gateway to answer the operator's question grounded on it. Restricted to
 * ops/admin. Only aggregates are sent to the model — never individual PII.
 */
export const opsChat = onCall(
  { enforceAppCheck: true, memory: "512MiB", secrets: [GEMINI_API_KEY] },
  async (req) => {
    requireRole(req, ["ops", "admin"]);
    const matchId = requireString(req.data?.matchId, "matchId", 100);
    const question = requireString(req.data?.question, "question", 500);
    const lang = normaliseLang(req.data?.lang);
    const history: OpsChatTurn[] = Array.isArray(req.data?.history)
      ? (req.data.history as OpsChatTurn[]).slice(-6)
      : [];

    const [fansSnap, ordersSnap, incidentsSnap] = await Promise.all([
      db.collection("fanProfiles").where("matchId", "==", matchId).get(),
      db.collection("orders").where("matchId", "==", matchId).get(),
      db.collection("incidents").where("matchId", "==", matchId).where("source", "==", "fan").get(),
    ]);

    const count = <T>(items: T[], key: (t: T) => string) => {
      const m = new Map<string, number>();
      for (const it of items) {
        const k = key(it);
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const fans = fansSnap.docs.map((d) => d.data());
    const accessibility = count(
      fans.flatMap((f) =>
        Array.isArray(f.accessibilityNeeds) ? (f.accessibilityNeeds as string[]) : []
      ),
      (n) => n
    );
    const orders = ordersSnap.docs.map((d) => d.data()).filter((o) => o.status !== "cancelled");

    const context: OpsChatContext = {
      totalFans: fans.length,
      partygoers: fans.reduce((s, f) => s + (Number(f.partySize) || 1), 0),
      sections: count(fans, (f) =>
        String((f.seat as { section?: string })?.section ?? "unknown")
      ).map(([section, c]) => ({ section, count: c })),
      transport: count(fans, (f) => String(f.transportMode ?? "unknown")).map(([mode, c]) => ({
        mode,
        count: c,
      })),
      accessibility: accessibility.map(([need, c]) => ({ need, count: c })),
      orders: {
        count: orders.length,
        revenueCents: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      },
      fanIncidents: incidentsSnap.docs.map((d) => {
        const i = d.data();
        return { type: String(i.type), zone: String(i.zone), severity: String(i.severity) };
      }),
    };

    return getGateway().opsChat(question, history, context, lang);
  }
);

function normaliseLang(value: unknown): Lang {
  return value === "es" || value === "fr" ? value : "en";
}
