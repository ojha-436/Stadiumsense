/**
 * Server-side mirror of the Firestore document shapes the functions read and
 * write. Kept deliberately minimal (only what the backend touches) and in sync
 * with the canonical client model at src/types/domain.ts.
 */
export type Lang = "en" | "es" | "fr";
export type Role = "fan" | "vendor" | "ops" | "admin";

export interface Player {
  number: number;
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  isStarter: boolean;
}
export interface TeamLineup {
  teamName: string;
  teamCode: string;
  formation: string;
  players: Player[];
}
export interface Match {
  stadiumId: string;
  venueName: string;
  city: string;
  country: "USA" | "MEX" | "CAN";
  kickoff: number;
  stage: string;
  home: TeamLineup;
  away: TeamLineup;
}

export interface OrderLine {
  itemId: string;
  name: string;
  qty: number;
  priceCents: number;
}

export interface Zone {
  name: string;
  densityPct: number;
  capacity: number;
  trend: "rising" | "steady" | "falling";
}
export interface Gate {
  label: string;
  queueMins: number;
  status: "open" | "closed";
}
export interface TransitLine {
  name: string;
  mode: "metro" | "bus" | "train";
  loadPct: number;
  headwayMins: number;
}
export interface Incident {
  type: string;
  zone: string;
  severity: "low" | "medium" | "high";
  description: string;
  status: "open" | "acknowledged" | "resolved";
}

export interface OpsAction {
  title: string;
  detail: string;
  priority: "low" | "medium" | "high";
}
