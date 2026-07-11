/**
 * Pure simulation model. Given the current operational state and how long until
 * kick-off, it computes the next tick's values. Kept free of Firestore/IO so it
 * is unit-testable and deterministic for a given (id, tick, minutesToKickoff).
 *
 * Real sensors would replace this module; nothing downstream would change
 * because it writes the same document shapes.
 */
export interface ZoneState {
  densityPct: number;
  capacity: number;
  trend: "rising" | "steady" | "falling";
}
export interface GateState {
  queueMins: number;
  throughputPerMin: number;
  status: "open" | "closed";
}
export interface TransitState {
  loadPct: number;
  headwayMins: number;
}

/** Deterministic 0..1 pseudo-random from a string+tick seed (no Math.random). */
function seeded(id: string, tick: number): number {
  let h = 2166136261 ^ tick;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/**
 * Arrival intensity curve: peaks 60–90 minutes before kick-off, tails off after.
 * Returns 0..1.
 */
export function arrivalIntensity(minutesToKickoff: number): number {
  const m = minutesToKickoff;
  if (m > 150) return 0.15;
  if (m > 90) return 0.45;
  if (m > 45) return 1.0; // peak inflow
  if (m > 0) return 0.7;
  if (m > -20) return 0.25; // late arrivals
  return 0.05;
}

export function nextZone(id: string, zone: ZoneState, minutesToKickoff: number, tick: number): ZoneState {
  const intensity = arrivalIntensity(minutesToKickoff);
  const noise = (seeded(id, tick) - 0.5) * 6;
  const target = 20 + intensity * 70; // 20%..90%
  const density = clamp(zone.densityPct + (target - zone.densityPct) * 0.3 + noise);
  const delta = density - zone.densityPct;
  const trend = delta > 1.5 ? "rising" : delta < -1.5 ? "falling" : "steady";
  return { ...zone, densityPct: Math.round(density), trend };
}

export function nextGate(id: string, gate: GateState, minutesToKickoff: number, tick: number): GateState {
  if (gate.status === "closed") return { ...gate, queueMins: 0 };
  const intensity = arrivalIntensity(minutesToKickoff);
  const noise = (seeded(id, tick) - 0.5) * 4;
  const queue = Math.max(0, Math.round(intensity * 18 + noise));
  return { ...gate, queueMins: queue };
}

export function nextTransit(
  id: string,
  line: TransitState,
  minutesToKickoff: number,
  tick: number
): TransitState {
  const intensity = arrivalIntensity(minutesToKickoff + 15); // transit leads foot traffic
  const noise = (seeded(id, tick) - 0.5) * 8;
  const load = clamp(25 + intensity * 65 + noise);
  return { ...line, loadPct: Math.round(load) };
}

/** Occasionally (seeded) surface an incident when a zone is very busy. */
export function maybeIncident(
  zoneId: string,
  zoneName: string,
  densityPct: number,
  tick: number
): { type: string; zone: string; severity: "low" | "medium" | "high"; description: string } | null {
  if (densityPct < 82) return null;
  if (seeded(zoneId + "-inc", tick) < 0.8) return null;
  return {
    type: "Crowd congestion",
    zone: zoneName,
    severity: densityPct > 90 ? "high" : "medium",
    description: `High crowd density detected in ${zoneName} (${densityPct}%). Consider redirecting arriving fans.`,
  };
}
