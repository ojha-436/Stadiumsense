import { collection, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/hooks";
import { useCollectionSnapshot, type AsyncData } from "@/lib/firestoreHooks";
import { mapGate, mapIncident, mapTransitLine, mapZone } from "@/lib/mappers";
import type { Gate, Incident, TransitLine, Zone } from "@/types/domain";

function useZonesReal(matchId: string | null): AsyncData<Zone[]> {
  return useCollectionSnapshot(
    matchId ? query(collection(db, COLLECTIONS.zones), where("matchId", "==", matchId)) : null,
    mapZone,
    [matchId]
  );
}

function useGatesReal(matchId: string | null): AsyncData<Gate[]> {
  return useCollectionSnapshot(
    matchId ? query(collection(db, COLLECTIONS.gates), where("matchId", "==", matchId)) : null,
    mapGate,
    [matchId]
  );
}

function useTransitLinesReal(matchId: string | null): AsyncData<TransitLine[]> {
  return useCollectionSnapshot(
    matchId
      ? query(collection(db, COLLECTIONS.transitLines), where("matchId", "==", matchId))
      : null,
    mapTransitLine,
    [matchId]
  );
}

function useIncidentsReal(matchId: string | null): AsyncData<Incident[]> {
  return useCollectionSnapshot(
    matchId
      ? query(
          collection(db, COLLECTIONS.incidents),
          where("matchId", "==", matchId),
          orderBy("createdAt", "desc")
        )
      : null,
    mapIncident,
    [matchId]
  );
}

export const useZones = DEMO ? demo.useZones : useZonesReal;
export const useGates = DEMO ? demo.useGates : useGatesReal;
export const useTransitLines = DEMO ? demo.useTransitLines : useTransitLinesReal;
export const useIncidents = DEMO ? demo.useIncidents : useIncidentsReal;
