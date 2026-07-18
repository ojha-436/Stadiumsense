import { describe, expect, it } from "vitest";
import type { Role } from "@/types/domain";
import { HOME_FOR_ROLE, landingRoute } from "./roles";

describe("landingRoute", () => {
  it("routes to complete-profile whenever needsProfile is true, regardless of role/status", () => {
    expect(landingRoute({ role: "admin", status: "active", needsProfile: true })).toBe(
      "/complete-profile"
    );
    expect(landingRoute({ role: "fan", status: "pending", needsProfile: true })).toBe(
      "/complete-profile"
    );
  });

  it("routes to /pending when an elevated request is still pending", () => {
    expect(landingRoute({ role: "vendor", status: "pending", needsProfile: false })).toBe("/pending");
  });

  it("routes to /pending when an elevated request was rejected", () => {
    expect(landingRoute({ role: "ops", status: "rejected", needsProfile: false })).toBe("/pending");
  });

  const roles: Role[] = ["fan", "vendor", "ops", "admin"];
  it.each(roles)("routes an active %s straight to their own dashboard", (role) => {
    expect(landingRoute({ role, status: "active", needsProfile: false })).toBe(HOME_FOR_ROLE[role]);
  });

  it("never lands a needs-profile account on a real dashboard — regression guard for the ChefAI-doc-collision bug", () => {
    // A `users/{uid}` doc existing from an unrelated app (no `status` field) must
    // surface as needsProfile=true upstream, and this function must still refuse
    // to send that account anywhere but the role chooser.
    const destination = landingRoute({ role: "fan", status: "active", needsProfile: true });
    expect(Object.values(HOME_FOR_ROLE)).not.toContain(destination);
  });
});
