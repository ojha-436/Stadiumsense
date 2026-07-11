import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { requireRole, requireString } from "../lib/guards.js";
import { GEMINI_API_KEY } from "../lib/secrets.js";
import { getGateway } from "../ai/index.js";
import type { Gate, Incident, Lang, Match, TransitLine, Zone } from "../domain.js";

/**
 * Generates a Gemini situation brief for the ops room from the current live
 * snapshot and stores it in `opsBriefs` so every ops viewer shares one brief.
 * Restricted to ops/admin roles.
 */
export const opsBrief = onCall(
  { enforceAppCheck: true, memory: "512MiB", secrets: [GEMINI_API_KEY] },
  async (req) => {
    requireRole(req, ["ops", "admin"]);
    const matchId = requireString(req.data?.matchId, "matchId", 100);
    const lang = normaliseLang(req.data?.lang);

    const matchSnap = await db.doc(`matches/${matchId}`).get();
    if (!matchSnap.exists) throw new HttpsError("not-found", "Match not found.");
    const match = matchSnap.data() as Match;

    const [zonesSnap, gatesSnap, transitSnap, incidentsSnap] = await Promise.all([
      db.collection("zones").where("matchId", "==", matchId).get(),
      db.collection("gates").where("matchId", "==", matchId).get(),
      db.collection("transitLines").where("matchId", "==", matchId).get(),
      db
        .collection("incidents")
        .where("matchId", "==", matchId)
        .where("status", "==", "open")
        .get(),
    ]);

    const snapshot = {
      zones: zonesSnap.docs.map((d) => d.data() as Zone),
      gates: gatesSnap.docs.map((d) => d.data() as Gate),
      transit: transitSnap.docs.map((d) => d.data() as TransitLine),
      incidents: incidentsSnap.docs.map((d) => d.data() as Incident),
      minutesToKickoff: Math.round((match.kickoff - Date.now()) / 60000),
    };

    const { summary, actions } = await getGateway().opsBrief(snapshot, lang);
    const createdAt = Date.now();
    await db.collection("opsBriefs").add({ matchId, lang, summary, actions, createdAt });
    return { summary, actions, createdAt };
  }
);

function normaliseLang(value: unknown): Lang {
  return value === "es" || value === "fr" ? value : "en";
}
