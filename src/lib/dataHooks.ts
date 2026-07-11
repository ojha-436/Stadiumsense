import { collection, limit, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS } from "./collections";
import { DEMO } from "./demo/flag";
import * as demo from "./demo/hooks";
import { useCollectionSnapshot, type AsyncData } from "./firestoreHooks";
import { mapMatch } from "./mappers";
import type { Match } from "@/types/domain";

/**
 * The active match for staff surfaces. The demo runs one live fixture; this
 * resolves the earliest match so ops/vendor/admin need no manual selection.
 * Multi-match support is a data change (add a selector), not a code change.
 */
function useActiveMatchReal(): AsyncData<Match | null> {
  const { data, loading, error } = useCollectionSnapshot(
    query(collection(db, COLLECTIONS.matches), orderBy("kickoff", "asc"), limit(1)),
    mapMatch,
    []
  );
  return { data: data[0] ?? null, loading, error };
}

export const useActiveMatch = DEMO ? demo.useActiveMatch : useActiveMatchReal;
