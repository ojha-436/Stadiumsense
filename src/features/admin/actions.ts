import { DEMO } from "@/lib/demo/flag";
import { demoAuth } from "@/lib/demo/auth";
import { api } from "@/lib/api";
import type { AccessRequest } from "@/types/domain";

/**
 * Approve or reject an access request. In production this calls the admin-only
 * `approveAccessRequest` Cloud Function (which sets the elevated custom claim);
 * in demo it updates the in-memory store and the current account if it matches.
 */
export async function decideAccessRequest(req: AccessRequest, approve: boolean): Promise<void> {
  if (DEMO) {
    demoAuth.decide(req.id, approve);
    return;
  }
  await api.approveAccessRequest({ requestId: req.id, approve });
}
