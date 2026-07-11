import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import { demoSetIncidentStatus, demoToggleAmenity } from "@/lib/demo/writes";
import type { AmenityStatus, IncidentStatus } from "@/types/domain";

export async function setIncidentStatus(id: string, status: IncidentStatus): Promise<void> {
  if (DEMO) return demoSetIncidentStatus(id, status);
  await updateDoc(doc(db, COLLECTIONS.incidents, id), { status });
}

export async function setAmenityStatus(id: string, status: AmenityStatus): Promise<void> {
  if (DEMO) return demoToggleAmenity(id, status);
  await updateDoc(doc(db, COLLECTIONS.amenities, id), { status, updatedAt: serverTimestamp() });
}
