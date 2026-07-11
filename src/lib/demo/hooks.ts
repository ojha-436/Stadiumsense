/**
 * Demo-mode implementations of every feature data hook. Each mirrors the real
 * hook's signature and return type but reads from the in-memory demo store, so
 * the feature modules can swap implementations at module load with no change to
 * any component. The shared mappers are reused verbatim.
 */
import {
  mapAccessRequest,
  mapAmenity,
  mapGate,
  mapIncident,
  mapMatch,
  mapOrder,
  mapPoll,
  mapPost,
  mapStall,
  mapTransitLine,
  mapUser,
  mapZone,
} from "@/lib/mappers";
import type { AsyncData } from "@/lib/firestoreHooks";
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
import { mapFanProfile } from "@/lib/mappers";
import { useDemoCollection, useDemoDoc } from "./store";

const byCreatedDesc = (a: { createdAt: number }, b: { createdAt: number }) => b.createdAt - a.createdAt;
const matchFilter = (matchId: string | null) => (d: Record<string, unknown>) =>
  !matchId || d.matchId === matchId;

// ── fan ──────────────────────────────────────────────────────────────────────
export const useFanProfile = (uid: string | null): AsyncData<FanProfile | null> =>
  useDemoDoc("fanProfiles", uid, mapFanProfile);

export const useMatch = (matchId: string | null): AsyncData<Match | null> =>
  useDemoDoc("matches", matchId, mapMatch);

export const useMatches = (): AsyncData<Match[]> =>
  useDemoCollection("matches", mapMatch, { sort: (a, b) => a.kickoff - b.kickoff });

export const useStalls = (matchId: string | null): AsyncData<Stall[]> =>
  useDemoCollection("stalls", mapStall, { filter: matchFilter(matchId), deps: [matchId] });

export const useMyOrders = (uid: string | null): AsyncData<Order[]> =>
  useDemoCollection("orders", mapOrder, {
    filter: (d) => d.fanUid === uid,
    sort: byCreatedDesc,
    deps: [uid],
  });

export const useAmenities = (matchId: string | null): AsyncData<Amenity[]> =>
  useDemoCollection("amenities", mapAmenity, { filter: matchFilter(matchId), deps: [matchId] });

// ── ops ──────────────────────────────────────────────────────────────────────
export const useZones = (matchId: string | null): AsyncData<Zone[]> =>
  useDemoCollection("zones", mapZone, { filter: matchFilter(matchId), deps: [matchId] });

export const useGates = (matchId: string | null): AsyncData<Gate[]> =>
  useDemoCollection("gates", mapGate, { filter: matchFilter(matchId), deps: [matchId] });

export const useTransitLines = (matchId: string | null): AsyncData<TransitLine[]> =>
  useDemoCollection("transitLines", mapTransitLine, { filter: matchFilter(matchId), deps: [matchId] });

export const useIncidents = (matchId: string | null): AsyncData<Incident[]> =>
  useDemoCollection("incidents", mapIncident, {
    filter: matchFilter(matchId),
    sort: byCreatedDesc,
    deps: [matchId],
  });

// ── vendor ─────────────────────────────────────────────────────────────────────
export const useStall = (stallId: string | null): AsyncData<Stall | null> =>
  useDemoDoc("stalls", stallId, mapStall);

export const useStallOrders = (stallId: string | null): AsyncData<Order[]> =>
  useDemoCollection("orders", mapOrder, {
    filter: (d) => d.stallId === stallId,
    sort: byCreatedDesc,
    deps: [stallId],
  });

// ── admin ────────────────────────────────────────────────────────────────────
export const useStaffUsers = (): AsyncData<UserDoc[]> =>
  useDemoCollection("users", mapUser, {
    filter: (d) => d.role === "vendor" || d.role === "ops" || d.role === "admin",
  });

export const usePendingRequests = (): AsyncData<AccessRequest[]> =>
  useDemoCollection("accessRequests", mapAccessRequest, {
    filter: (d) => d.status === "pending",
    sort: byCreatedDesc,
  });

// ── wall ─────────────────────────────────────────────────────────────────────
export const usePublishedPosts = (matchId: string): AsyncData<Post[]> =>
  useDemoCollection("posts", mapPost, {
    filter: (d) => d.matchId === matchId && d.published === true,
    sort: byCreatedDesc,
    deps: [matchId],
  });

export const usePolls = (matchId: string): AsyncData<Poll[]> =>
  useDemoCollection("polls", mapPoll, {
    filter: (d) => d.matchId === matchId,
    sort: byCreatedDesc,
    deps: [matchId],
  });

// ── shared ───────────────────────────────────────────────────────────────────
export function useActiveMatch(): AsyncData<Match | null> {
  const { data } = useMatches();
  return { data: data[0] ?? null, loading: false, error: null };
}
