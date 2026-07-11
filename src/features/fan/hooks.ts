import { collection, doc, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/hooks";
import {
  useCollectionSnapshot,
  useDocSnapshot,
  type AsyncData,
} from "@/lib/firestoreHooks";
import {
  mapAmenity,
  mapFanProfile,
  mapMatch,
  mapOrder,
  mapStall,
} from "@/lib/mappers";
import type { Amenity, FanProfile, Match, Order, Stall } from "@/types/domain";

// Real (Firebase-backed) implementations. In demo mode these are swapped for
// in-memory equivalents at module load — call sites are unchanged.

function useFanProfileReal(uid: string | null): AsyncData<FanProfile | null> {
  return useDocSnapshot(uid ? doc(db, COLLECTIONS.fanProfiles, uid) : null, mapFanProfile);
}

function useMatchReal(matchId: string | null): AsyncData<Match | null> {
  return useDocSnapshot(matchId ? doc(db, COLLECTIONS.matches, matchId) : null, mapMatch);
}

function useMatchesReal(): AsyncData<Match[]> {
  return useCollectionSnapshot(
    query(collection(db, COLLECTIONS.matches), orderBy("kickoff", "asc")),
    mapMatch,
    []
  );
}

function useStallsReal(matchId: string | null): AsyncData<Stall[]> {
  return useCollectionSnapshot(
    matchId
      ? query(collection(db, COLLECTIONS.stalls), where("matchId", "==", matchId))
      : null,
    mapStall,
    [matchId]
  );
}

function useMyOrdersReal(uid: string | null): AsyncData<Order[]> {
  return useCollectionSnapshot(
    uid
      ? query(
          collection(db, COLLECTIONS.orders),
          where("fanUid", "==", uid),
          orderBy("createdAt", "desc")
        )
      : null,
    mapOrder,
    [uid]
  );
}

function useAmenitiesReal(matchId: string | null): AsyncData<Amenity[]> {
  return useCollectionSnapshot(
    matchId
      ? query(collection(db, COLLECTIONS.amenities), where("matchId", "==", matchId))
      : null,
    mapAmenity,
    [matchId]
  );
}

export const useFanProfile = DEMO ? demo.useFanProfile : useFanProfileReal;
export const useMatch = DEMO ? demo.useMatch : useMatchReal;
export const useMatches = DEMO ? demo.useMatches : useMatchesReal;
export const useStalls = DEMO ? demo.useStalls : useStallsReal;
export const useMyOrders = DEMO ? demo.useMyOrders : useMyOrdersReal;
export const useAmenities = DEMO ? demo.useAmenities : useAmenitiesReal;
