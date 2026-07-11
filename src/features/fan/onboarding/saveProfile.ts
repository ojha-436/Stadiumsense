import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import { demoSaveProfile } from "@/lib/demo/writes";
import type { AccessibilityNeed, SeatLocation, TransportMode } from "@/types/domain";

export interface ProfileDraft {
  matchId: string;
  seat: SeatLocation;
  startAddress?: string;
  transportMode: TransportMode;
  partySize: number;
  accessibilityNeeds: AccessibilityNeed[];
  source: "scan" | "questionnaire";
}

/** Persist the fan's matchday profile. Writing this doc unlocks the tabbed app. */
export async function saveFanProfile(uid: string, draft: ProfileDraft): Promise<void> {
  if (DEMO) return demoSaveProfile(uid, draft);
  await setDoc(doc(db, COLLECTIONS.fanProfiles, uid), {
    ...draft,
    startAddress: draft.startAddress ?? null,
    updatedAt: serverTimestamp(),
  });
}
