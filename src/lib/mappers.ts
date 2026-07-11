/**
 * Firestore document → domain object mappers. Centralising these keeps the
 * `id`-hydration and default-filling logic in one place, so components receive
 * fully-typed objects and never touch raw `DocumentData`.
 */
import type {
  AccessRequest,
  Amenity,
  FanProfile,
  Gate,
  Incident,
  Match,
  Order,
  Poll,
  Post,
  Stall,
  TransitLine,
  UserDoc,
  Zone,
} from "@/types/domain";

type Data = Record<string, unknown>;

const num = (v: unknown, d = 0): number => (typeof v === "number" ? v : d);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const bool = (v: unknown, d = false): boolean => (typeof v === "boolean" ? v : d);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Firestore Timestamp | number | undefined → epoch ms. */
export function toMillis(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v && typeof v.toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export const mapUser = (id: string, d: Data): UserDoc => ({
  id,
  role: (str(d.role, "fan") as UserDoc["role"]) ?? "fan",
  displayName: str(d.displayName, "User"),
  firstName: typeof d.firstName === "string" ? d.firstName : undefined,
  lastName: typeof d.lastName === "string" ? d.lastName : undefined,
  email: str(d.email),
  phone: typeof d.phone === "string" ? d.phone : undefined,
  lang: (str(d.lang, "en") as UserDoc["lang"]) ?? "en",
  active: bool(d.active, true),
  status: (str(d.status, "active") as UserDoc["status"]) ?? "active",
  requestedRole:
    typeof d.requestedRole === "string" ? (d.requestedRole as UserDoc["requestedRole"]) : undefined,
  stallId: typeof d.stallId === "string" ? d.stallId : undefined,
  createdAt: toMillis(d.createdAt),
});

export const mapAccessRequest = (id: string, d: Data): AccessRequest => ({
  id,
  uid: str(d.uid),
  displayName: str(d.displayName, "User"),
  email: str(d.email),
  phone: typeof d.phone === "string" ? d.phone : undefined,
  requestedRole: (str(d.requestedRole, "ops") as AccessRequest["requestedRole"]) ?? "ops",
  status: (str(d.status, "pending") as AccessRequest["status"]) ?? "pending",
  createdAt: toMillis(d.createdAt),
  decidedAt: typeof d.decidedAt === "number" ? d.decidedAt : undefined,
});

export const mapFanProfile = (id: string, d: Data): FanProfile => ({
  id,
  matchId: str(d.matchId),
  seat: (d.seat as FanProfile["seat"]) ?? { section: "", row: "", seat: "" },
  startAddress: typeof d.startAddress === "string" ? d.startAddress : undefined,
  startLocation: (d.startLocation as FanProfile["startLocation"]) ?? undefined,
  transportMode: (str(d.transportMode, "transit") as FanProfile["transportMode"]) ?? "transit",
  partySize: num(d.partySize, 1),
  accessibilityNeeds: arr<FanProfile["accessibilityNeeds"][number]>(d.accessibilityNeeds),
  source: (str(d.source, "questionnaire") as FanProfile["source"]) ?? "questionnaire",
  updatedAt: toMillis(d.updatedAt),
});

export const mapMatch = (id: string, d: Data): Match => ({
  id,
  stadiumId: str(d.stadiumId),
  venueName: str(d.venueName),
  city: str(d.city),
  country: (str(d.country, "USA") as Match["country"]) ?? "USA",
  kickoff: toMillis(d.kickoff),
  stage: str(d.stage),
  home: d.home as Match["home"],
  away: d.away as Match["away"],
});

export const mapStall = (id: string, d: Data): Stall => ({
  id,
  matchId: str(d.matchId),
  name: str(d.name),
  zone: str(d.zone),
  vendorUid: str(d.vendorUid),
  open: bool(d.open, true),
  menu: arr<Stall["menu"][number]>(d.menu),
});

export const mapOrder = (id: string, d: Data): Order => ({
  id,
  fanUid: str(d.fanUid),
  stallId: str(d.stallId),
  stallName: str(d.stallName),
  matchId: str(d.matchId),
  items: arr<Order["items"][number]>(d.items),
  seat: (d.seat as Order["seat"]) ?? { section: "", row: "", seat: "" },
  total: num(d.total),
  status: (str(d.status, "placed") as Order["status"]) ?? "placed",
  timeline: arr<Order["timeline"][number]>(d.timeline),
  createdAt: toMillis(d.createdAt),
});

export const mapAmenity = (id: string, d: Data): Amenity => ({
  id,
  matchId: str(d.matchId),
  type: (str(d.type, "water") as Amenity["type"]) ?? "water",
  label: str(d.label),
  zone: str(d.zone),
  location: (d.location as Amenity["location"]) ?? undefined,
  status: (str(d.status, "available") as Amenity["status"]) ?? "available",
  updatedAt: toMillis(d.updatedAt),
});

export const mapZone = (id: string, d: Data): Zone => ({
  id,
  matchId: str(d.matchId),
  name: str(d.name),
  densityPct: num(d.densityPct),
  capacity: num(d.capacity),
  trend: (str(d.trend, "steady") as Zone["trend"]) ?? "steady",
  updatedAt: toMillis(d.updatedAt),
});

export const mapGate = (id: string, d: Data): Gate => ({
  id,
  matchId: str(d.matchId),
  label: str(d.label),
  queueMins: num(d.queueMins),
  throughputPerMin: num(d.throughputPerMin),
  status: (str(d.status, "open") as Gate["status"]) ?? "open",
  updatedAt: toMillis(d.updatedAt),
});

export const mapTransitLine = (id: string, d: Data): TransitLine => ({
  id,
  matchId: str(d.matchId),
  name: str(d.name),
  mode: (str(d.mode, "metro") as TransitLine["mode"]) ?? "metro",
  loadPct: num(d.loadPct),
  headwayMins: num(d.headwayMins),
  updatedAt: toMillis(d.updatedAt),
});

export const mapIncident = (id: string, d: Data): Incident => ({
  id,
  matchId: str(d.matchId),
  type: str(d.type),
  zone: str(d.zone),
  source: (str(d.source, "ops") as Incident["source"]) ?? "ops",
  severity: (str(d.severity, "low") as Incident["severity"]) ?? "low",
  description: str(d.description),
  photoUrl: typeof d.photoUrl === "string" ? d.photoUrl : undefined,
  reportedBy: typeof d.reportedBy === "string" ? d.reportedBy : undefined,
  status: (str(d.status, "open") as Incident["status"]) ?? "open",
  createdAt: toMillis(d.createdAt),
});

export const mapPost = (id: string, d: Data): Post => ({
  id,
  matchId: str(d.matchId),
  authorUid: str(d.authorUid),
  authorName: str(d.authorName, "Fan"),
  imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : undefined,
  caption: str(d.caption),
  altText: typeof d.altText === "string" ? d.altText : undefined,
  playerTag: typeof d.playerTag === "string" ? d.playerTag : undefined,
  published: bool(d.published),
  createdAt: toMillis(d.createdAt),
});

export const mapPoll = (id: string, d: Data): Poll => ({
  id,
  matchId: str(d.matchId),
  question: str(d.question),
  kind: (str(d.kind, "custom") as Poll["kind"]) ?? "custom",
  options: arr<Poll["options"][number]>(d.options),
  createdBy: str(d.createdBy),
  createdAt: toMillis(d.createdAt),
});
