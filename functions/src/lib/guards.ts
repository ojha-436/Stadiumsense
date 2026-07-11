import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import type { Role } from "../domain.js";

export interface Caller {
  uid: string;
  role: Role;
  stallId: string | null;
}

/** Assert the caller is authenticated and return their identity + claims. */
export function requireAuth(req: CallableRequest): Caller {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const token = req.auth.token as { role?: Role; stallId?: string };
  return {
    uid: req.auth.uid,
    role: token.role ?? "fan",
    stallId: token.stallId ?? null,
  };
}

/** Assert the caller holds one of the allowed roles. */
export function requireRole(req: CallableRequest, allow: Role[]): Caller {
  const caller = requireAuth(req);
  if (!allow.includes(caller.role)) {
    throw new HttpsError("permission-denied", "Insufficient role for this action.");
  }
  return caller;
}

/** Validate a value is a non-empty string within a length bound. */
export function requireString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    throw new HttpsError("invalid-argument", `Invalid "${field}".`);
  }
  return value;
}
