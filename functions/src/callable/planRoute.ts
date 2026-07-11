import { onCall } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { requireAuth, requireString } from "../lib/guards.js";
import { getRouteCandidates } from "../lib/maps.js";
import { getGateway } from "../ai/index.js";
import type { Lang, TransitLine } from "../domain.js";

/**
 * Plan the home→stadium journey. Candidate routes come from Maps (or a
 * deploy-safe synthesiser); Gemini then ranks them against live transit load
 * so the fan sees the least-crowded option with a plain-language rationale.
 */
export const planRoute = onCall({ enforceAppCheck: true }, async (req) => {
  requireAuth(req);
  const matchId = requireString(req.data?.matchId, "matchId", 100);
  const startAddress = requireString(req.data?.startAddress, "startAddress", 200);
  const transportMode = requireString(req.data?.transportMode, "transportMode", 20);
  const lang = normaliseLang(req.data?.lang);

  const candidates = await getRouteCandidates(startAddress, transportMode);

  const transitSnap = await db.collection("transitLines").where("matchId", "==", matchId).get();
  const transitLines = transitSnap.docs.map((d) => d.data() as TransitLine);

  const routes = await getGateway().rankRoutes({ candidates, transitLines, lang });
  const best =
    [...routes].sort((a, b) => crowdScore(a.crowdLevel) - crowdScore(b.crowdLevel))[0] ?? routes[0];

  return { options: routes, bestOptionId: best?.id ?? "" };
});

function crowdScore(level: "low" | "medium" | "high"): number {
  return { low: 0, medium: 1, high: 2 }[level];
}
function normaliseLang(value: unknown): Lang {
  return value === "es" || value === "fr" ? value : "en";
}
