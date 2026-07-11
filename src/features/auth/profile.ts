import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { RequestedRole } from "@/types/domain";

export interface NewProfileInput {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  requestedRole: RequestedRole;
}

/**
 * Create a user's profile document. Everyone starts with the `fan` claim; a
 * request for `vendor` or `ops` (Stadium Operator) is recorded as a pending
 * access request that an admin approves before the elevated claim is granted.
 * This keeps role escalation server-gated — a client can never self-elevate.
 */
export async function createUserProfile(input: NewProfileInput): Promise<void> {
  const elevated = input.requestedRole !== "fan";
  const displayName = `${input.firstName} ${input.lastName}`.trim() || "Fan";

  await setDoc(doc(db, COLLECTIONS.users, input.uid), {
    role: "fan",
    displayName,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    ...(input.phone ? { phone: input.phone } : {}),
    lang: document.documentElement.lang || "en",
    active: true,
    status: elevated ? "pending" : "active",
    ...(elevated ? { requestedRole: input.requestedRole } : {}),
    createdAt: serverTimestamp(),
  });

  if (elevated) {
    await addDoc(collection(db, COLLECTIONS.accessRequests), {
      uid: input.uid,
      displayName,
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
      requestedRole: input.requestedRole,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }
}

/** Whether a user already has a profile document (used to route Google users). */
export async function hasProfile(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists();
}
