/**
 * StadiumSense crowd/transit simulator (Cloud Run).
 *
 * GET /tick advances the operational state one step for the active match and
 * writes zones/gates/transitLines/incidents into Firestore — the same
 * collections the ops dashboard listens to. Cloud Scheduler calls /tick on a
 * fixed cadence; locally, START_LOOP=true self-ticks for demos.
 */
import express from "express";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  maybeIncident,
  nextGate,
  nextTransit,
  nextZone,
  type GateState,
  type TransitState,
  type ZoneState,
} from "./simulate.js";

if (getApps().length === 0) initializeApp();
const db = getFirestore();

let tick = 0;

async function runTick(): Promise<{ match: string; zones: number } | null> {
  const matchSnap = await db.collection("matches").orderBy("kickoff", "asc").limit(1).get();
  if (matchSnap.empty) return null;
  const matchDoc = matchSnap.docs[0];
  const matchId = matchDoc.id;
  const kickoff = Number(matchDoc.get("kickoff") ?? Date.now());
  const minutesToKickoff = Math.round((kickoff - Date.now()) / 60000);
  tick += 1;

  const [zones, gates, transit] = await Promise.all([
    db.collection("zones").where("matchId", "==", matchId).get(),
    db.collection("gates").where("matchId", "==", matchId).get(),
    db.collection("transitLines").where("matchId", "==", matchId).get(),
  ]);

  const batch = db.batch();
  const now = Date.now();

  for (const doc of zones.docs) {
    const cur = doc.data() as ZoneState & { name: string };
    const next = nextZone(doc.id, cur, minutesToKickoff, tick);
    batch.update(doc.ref, { ...next, updatedAt: now });

    const incident = maybeIncident(doc.id, cur.name, next.densityPct, tick);
    if (incident) {
      const incRef = db.collection("incidents").doc(`sim-${doc.id}-${tick}`);
      batch.set(incRef, {
        ...incident,
        matchId,
        source: "simulator",
        status: "open",
        createdAt: now,
      });
    }
  }

  for (const doc of gates.docs) {
    const next = nextGate(doc.id, doc.data() as GateState, minutesToKickoff, tick);
    batch.update(doc.ref, { ...next, updatedAt: now });
  }

  for (const doc of transit.docs) {
    const next = nextTransit(doc.id, doc.data() as TransitState, minutesToKickoff, tick);
    batch.update(doc.ref, { ...next, updatedAt: now });
  }

  await batch.commit();
  return { match: matchId, zones: zones.size };
}

const app = express();

app.get("/", (_req, res) => res.status(200).send("StadiumSense simulator OK"));

app.get("/tick", async (_req, res) => {
  try {
    const result = await runTick();
    if (!result) {
      res.status(404).json({ ok: false, reason: "no active match" });
      return;
    }
    res.status(200).json({ ok: true, tick, ...result });
  } catch (err) {
    console.error("tick failed", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  console.warn(`simulator listening on :${port}`);
  if (process.env.START_LOOP === "true") {
    setInterval(() => {
      void runTick().catch((e) => console.error("loop tick failed", e));
    }, 5000);
  }
});
