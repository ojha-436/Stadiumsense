import { randomBytes } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminAuth, db } from "../lib/admin.js";
import { requireRole, requireString } from "../lib/guards.js";
import type { Role } from "../domain.js";

const ASSIGNABLE_ROLES: Role[] = ["vendor", "ops", "admin"];

/**
 * Admin-only: create a staff/vendor account, set its role (and stallId for
 * vendors) as a custom claim, and write its profile doc. Roles live ONLY in
 * claims set here — a client can never grant itself a role.
 */
export const provisionUser = onCall({ enforceAppCheck: true }, async (req) => {
  requireRole(req, ["admin"]);
  const email = requireString(req.data?.email, "email", 200);
  const displayName = requireString(req.data?.displayName, "displayName", 80);
  const role = req.data?.role as Role;
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new HttpsError("invalid-argument", "Role must be vendor, ops, or admin.");
  }
  const stallId = role === "vendor" ? requireString(req.data?.stallId, "stallId", 100) : undefined;

  const tempPassword = generateTempPassword();
  const user = await adminAuth.createUser({ email, password: tempPassword, displayName });

  const claims: Record<string, unknown> = { role, active: true };
  if (stallId) claims.stallId = stallId;
  await adminAuth.setCustomUserClaims(user.uid, claims);

  await db.doc(`users/${user.uid}`).set({
    role,
    displayName,
    email,
    lang: "en",
    active: true,
    ...(stallId ? { stallId } : {}),
    createdAt: Date.now(),
  });

  // If provisioning a vendor, bind the stall to them so rules can match.
  if (stallId) {
    await db.doc(`stalls/${stallId}`).set({ vendorUid: user.uid }, { merge: true });
  }

  return { uid: user.uid, tempPassword };
});

/** Admin-only: activate/deactivate an account. Deactivation revokes the claim
 *  and refresh tokens so the user loses access on their next token refresh. */
export const setUserActive = onCall({ enforceAppCheck: true }, async (req) => {
  requireRole(req, ["admin"]);
  const uid = requireString(req.data?.uid, "uid", 128);
  const active = req.data?.active === true;

  const user = await adminAuth.getUser(uid);
  await adminAuth.setCustomUserClaims(uid, { ...user.customClaims, active });
  await db.doc(`users/${uid}`).set({ active }, { merge: true });
  if (!active) await adminAuth.revokeRefreshTokens(uid);
  return { uid, active };
});

function generateTempPassword(): string {
  // Cryptographically-secure one-time password the admin hands to the new user.
  return randomBytes(12).toString("base64url");
}
