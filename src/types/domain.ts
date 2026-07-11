/**
 * StadiumSense domain model — the single source of truth for every document
 * shape in Firestore. Both the UI and (mirrored) the Cloud Functions read these
 * types, so a change here is a change to the data contract.
 *
 * Conventions:
 *  - Timestamps are stored as epoch milliseconds (number) for portability
 *    across the client, Functions, and the simulator. The UI formats them.
 *  - Every collection document carries its own `id` when read into memory,
 *    hydrated from the Firestore document id (never written back).
 */

/** Roles are carried in the Firebase Auth custom claim `role`. */
export type Role = "fan" | "vendor" | "ops" | "admin";

/** Roles a user may request at sign-up. `fan` is granted immediately; `vendor`
 *  and `ops` (Stadium Operator) require admin approval before the claim is set. */
export type RequestedRole = "fan" | "vendor" | "ops";

/** Lifecycle of an elevated-access request. */
export type AccountStatus = "active" | "pending" | "rejected";

/** Languages supported across the three host nations (USA / MEX / CAN). */
export type Lang = "en" | "es" | "fr";
export const SUPPORTED_LANGS: readonly Lang[] = ["en", "es", "fr"] as const;

// ── Users & fan profile ──────────────────────────────────────────────────────

export interface UserDoc {
  id: string;
  role: Role;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  lang: Lang;
  active: boolean;
  /** "pending" until an admin approves an elevated-access request. */
  status: AccountStatus;
  /** The elevated role the user asked for while status is "pending". */
  requestedRole?: RequestedRole;
  /** Present only for vendor accounts — pins the stall they may manage. */
  stallId?: string;
  createdAt: number;
}

/** An operator/vendor request awaiting admin approval in the admin portal. */
export interface AccessRequest {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  requestedRole: Exclude<RequestedRole, "fan">;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  decidedAt?: number;
}

export type TransportMode = "transit" | "driving" | "walking" | "rideshare";

export type AccessibilityNeed =
  | "wheelchair"
  | "step-free"
  | "low-vision"
  | "hearing"
  | "sensory-friendly";

export interface SeatLocation {
  section: string;
  row: string;
  seat: string;
  /** Suggested/printed entry gate, e.g. "C". */
  gate?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** The fan's matchday inputs — produced identically by scan or questionnaire. */
export interface FanProfile {
  id: string; // == uid
  matchId: string;
  seat: SeatLocation;
  startAddress?: string;
  startLocation?: GeoPoint;
  transportMode: TransportMode;
  partySize: number;
  accessibilityNeeds: AccessibilityNeed[];
  source: "scan" | "questionnaire";
  updatedAt: number;
}

// ── Matches, lineups & cached AI content ─────────────────────────────────────

export interface Player {
  number: number;
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  isStarter: boolean;
}

export interface TeamLineup {
  teamName: string;
  teamCode: string; // FIFA 3-letter code, e.g. "ARG"
  formation: string; // e.g. "4-3-3"
  players: Player[];
}

export interface Match {
  id: string;
  stadiumId: string;
  venueName: string;
  city: string;
  country: "USA" | "MEX" | "CAN";
  kickoff: number;
  stage: string; // e.g. "Group A", "Final"
  home: TeamLineup;
  away: TeamLineup;
}

/** Gemini-generated, per-language, cached once per match (never per user). */
export interface MatchContent {
  lang: Lang;
  preview: string;
  facts: string[];
  generatedAt: number;
}

// ── Food stalls & orders ─────────────────────────────────────────────────────

export interface MenuItem {
  itemId: string;
  name: string;
  priceCents: number;
  stock: number;
  soldOut: boolean;
  veg: boolean;
}

export interface Stall {
  id: string;
  matchId: string;
  name: string;
  zone: string;
  vendorUid: string;
  open: boolean;
  menu: MenuItem[];
}

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";

/** The ordered statuses a vendor advances an order through, in sequence. */
export const ORDER_FLOW: readonly OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "delivering",
  "delivered",
] as const;

export interface OrderLine {
  itemId: string;
  name: string;
  qty: number;
  priceCents: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: number;
}

export interface Order {
  id: string;
  fanUid: string;
  stallId: string;
  stallName: string;
  matchId: string;
  items: OrderLine[];
  seat: SeatLocation;
  total: number; // cents
  status: OrderStatus;
  timeline: OrderStatusEvent[];
  createdAt: number;
}

// ── Amenities, zones, gates, transit (operational spine) ─────────────────────

export type AmenityType = "water" | "toilet" | "firstaid";
export type AmenityStatus = "available" | "busy" | "closed";

export interface Amenity {
  id: string;
  matchId: string;
  type: AmenityType;
  label: string;
  zone: string;
  location?: GeoPoint;
  /** Rough distance hint from a section, keyed by section id. */
  status: AmenityStatus;
  updatedAt: number;
}

export type DensityTrend = "rising" | "steady" | "falling";

/** Written only by the Cloud Run simulator (or, later, real sensors). */
export interface Zone {
  id: string;
  matchId: string;
  name: string;
  densityPct: number; // 0–100
  capacity: number;
  trend: DensityTrend;
  updatedAt: number;
}

export interface Gate {
  id: string;
  matchId: string;
  label: string;
  queueMins: number;
  throughputPerMin: number;
  status: "open" | "closed";
  updatedAt: number;
}

export interface TransitLine {
  id: string;
  matchId: string;
  name: string;
  mode: "metro" | "bus" | "train";
  loadPct: number; // 0–100
  headwayMins: number;
  updatedAt: number;
}

// ── Incidents & ops briefs ───────────────────────────────────────────────────

export type IncidentSource = "fan" | "simulator" | "ops";
export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "open" | "acknowledged" | "resolved";

export interface Incident {
  id: string;
  matchId: string;
  type: string;
  zone: string;
  source: IncidentSource;
  severity: IncidentSeverity;
  description: string;
  photoUrl?: string;
  reportedBy?: string;
  status: IncidentStatus;
  createdAt: number;
}

export interface OpsAction {
  title: string;
  detail: string;
  priority: IncidentSeverity;
}

/** Gemini situation brief for the ops room, shared by all viewers. */
export interface OpsBrief {
  id: string;
  matchId: string;
  lang: Lang;
  summary: string;
  actions: OpsAction[];
  createdAt: number;
}

// ── Social wall & polls (P1) ─────────────────────────────────────────────────

export interface Post {
  id: string;
  matchId: string;
  authorUid: string;
  authorName: string;
  imageUrl?: string;
  caption: string;
  altText?: string;
  playerTag?: string;
  published: boolean;
  createdAt: number;
}

export interface PollOption {
  optionId: string;
  label: string;
  count: number;
}

export interface Poll {
  id: string;
  matchId: string;
  question: string;
  kind: "winner" | "goals" | "custom";
  options: PollOption[];
  createdBy: string;
  createdAt: number;
}
