import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { requireAuth, requireString } from "../lib/guards.js";
import { GEMINI_API_KEY } from "../lib/secrets.js";
import { getGateway } from "../ai/index.js";
import type { Lang, Match } from "../domain.js";

const PLAN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Gemini arrival plan (leave-by time, arrive-by time, gate, reasoning).
 * Cached per (match, section, startArea, transport, lang) bucket with a short
 * TTL so fans in the same section reuse one generation.
 */
export const planArrival = onCall(
  { enforceAppCheck: true, memory: "512MiB", secrets: [GEMINI_API_KEY] },
  async (req) => {
    const caller = requireAuth(req);
    const matchId = requireString(req.data?.matchId, "matchId", 100);
    const section = requireString(req.data?.section, "section", 20);
    const transportMode = requireString(req.data?.transportMode, "transportMode", 20);
    const lang = normaliseLang(req.data?.lang);
    const startArea =
      typeof req.data?.startArea === "string" ? req.data.startArea.slice(0, 120) : undefined;
    const gate = typeof req.data?.gate === "string" ? req.data.gate.slice(0, 8) : undefined;
    const accessibilityNeeds = Array.isArray(req.data?.accessibilityNeeds)
      ? (req.data.accessibilityNeeds as unknown[])
          .filter((n): n is string => typeof n === "string")
          .slice(0, 6)
      : [];

    const bucket = `${matchId}_${section}_${startArea ?? "na"}_${transportMode}_${lang}`.replace(
      /[^A-Za-z0-9_-]/g,
      "-"
    );
    const cacheRef = db.doc(`plans/${bucket}`);
    const cached = await cacheRef.get();
    const now = Date.now();
    if (cached.exists && now - (cached.data()?.generatedAt ?? 0) < PLAN_TTL_MS) {
      return { ...cached.data()?.plan, cached: true };
    }

    const matchSnap = await db.doc(`matches/${matchId}`).get();
    if (!matchSnap.exists) throw new HttpsError("not-found", "Match not found.");
    const match = matchSnap.data() as Match;

    const plan = await getGateway().planArrival({
      match,
      section,
      gate,
      startArea,
      transportMode,
      accessibilityNeeds,
      lang,
    });

    await cacheRef.set({ plan, generatedAt: now, by: caller.uid });
    return { ...plan, cached: false };
  }
);

function normaliseLang(value: unknown): Lang {
  return value === "es" || value === "fr" ? value : "en";
}
