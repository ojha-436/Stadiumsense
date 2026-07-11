import type { AccountStatus, Role } from "@/types/domain";

/** The default landing route for each role after sign-in. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  fan: "/fan",
  vendor: "/vendor",
  ops: "/ops",
  admin: "/admin",
};

/**
 * Where a signed-in user should land, accounting for the account lifecycle:
 *  - no profile yet (new Google user) → complete-profile step
 *  - elevated request still pending    → waiting screen
 *  - otherwise                         → their role's dashboard
 */
export function landingRoute(opts: {
  role: Role;
  status: AccountStatus;
  needsProfile: boolean;
}): string {
  if (opts.needsProfile) return "/complete-profile";
  if (opts.status === "pending" || opts.status === "rejected") return "/pending";
  return HOME_FOR_ROLE[opts.role];
}
