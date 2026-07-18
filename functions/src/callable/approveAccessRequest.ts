import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminAuth, db } from "../lib/admin.js";
import { requireRole, requireString } from "../lib/guards.js";
import type { Role } from "../domain.js";

/**
 * Admin-only: approve or reject a vendor/operator access request. On approval
 * the elevated role is written as a custom claim (and the profile updated), so
 * the user gains their dashboard on the next token refresh. Rejection marks the
 * request and the user's profile without granting anything.
 */
export const approveAccessRequest = onCall({ enforceAppCheck: true }, async (req) => {
  requireRole(req, ["admin"]);
  const requestId = requireString(req.data?.requestId, "requestId", 128);
  const approve = req.data?.approve === true;

  const reqRef = db.doc(`accessRequests/${requestId}`);
  const snap = await reqRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "Request not found.");

  const request = snap.data() as { uid: string; requestedRole: Role };
  const uid = request.uid;
  const role: Role = request.requestedRole;

  if (approve) {
    const user = await adminAuth.getUser(uid);
    const claims: Record<string, unknown> = { ...user.customClaims, role, active: true };
    // Bind a stall to newly-approved vendors so rules can scope their data.
    if (role === "vendor")
      claims.stallId = user.customClaims?.stallId ?? `stall-${uid.slice(0, 6)}`;
    // Set the elevated claim. We deliberately do NOT revoke refresh tokens here:
    // the newly-approved user is still on the pending screen, and their
    // "Check status" action calls getIdToken(true) to pull the new claim. A
    // revoke would invalidate that refresh token and force a full re-login
    // instead of promoting them in place. (Deactivation in setUserActive still
    // revokes, which is correct — there we want to kick the session out.)
    await adminAuth.setCustomUserClaims(uid, claims);
    await db
      .doc(`users/${uid}`)
      .set(
        {
          role,
          status: "active",
          requestedRole: null,
          ...(claims.stallId ? { stallId: claims.stallId } : {}),
        },
        { merge: true }
      );
  } else {
    await db.doc(`users/${uid}`).set({ status: "rejected", requestedRole: null }, { merge: true });
  }

  await reqRef.set(
    { status: approve ? "approved" : "rejected", decidedAt: Date.now() },
    { merge: true }
  );
  return { uid, role: approve ? role : "fan", status: approve ? "active" : "rejected" };
});
