import { describe, expect, it } from "vitest";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { requireAuth, requireRole, requireString } from "./guards.js";

/** Minimal CallableRequest stand-in — only `.auth` is read by these guards. */
function fakeRequest(auth?: { uid: string; token: Record<string, unknown> }): CallableRequest {
  return { auth } as unknown as CallableRequest;
}

describe("requireAuth", () => {
  it("returns the caller's uid/role/stallId when authenticated", () => {
    const caller = requireAuth(fakeRequest({ uid: "u1", token: { role: "vendor", stallId: "s1" } }));
    expect(caller).toEqual({ uid: "u1", role: "vendor", stallId: "s1" });
  });

  it("defaults role to fan and stallId to null when claims are absent", () => {
    const caller = requireAuth(fakeRequest({ uid: "u2", token: {} }));
    expect(caller).toEqual({ uid: "u2", role: "fan", stallId: null });
  });

  it("throws unauthenticated when there is no auth context", () => {
    expect(() => requireAuth(fakeRequest(undefined))).toThrow(HttpsError);
  });
});

describe("requireRole", () => {
  it("returns the caller when their role is in the allow-list", () => {
    const caller = requireRole(fakeRequest({ uid: "u1", token: { role: "admin" } }), ["admin"]);
    expect(caller.role).toBe("admin");
  });

  it("throws permission-denied when the role is not in the allow-list", () => {
    expect(() =>
      requireRole(fakeRequest({ uid: "u1", token: { role: "fan" } }), ["admin", "ops"])
    ).toThrow(HttpsError);
  });

  it("throws unauthenticated (not permission-denied) when signed out entirely", () => {
    expect(() => requireRole(fakeRequest(undefined), ["admin"])).toThrow(HttpsError);
  });
});

describe("requireString", () => {
  it("returns the string unchanged when valid", () => {
    expect(requireString("hello", "field")).toBe("hello");
  });

  it("throws invalid-argument for a non-string value", () => {
    expect(() => requireString(42, "field")).toThrow(HttpsError);
    expect(() => requireString(undefined, "field")).toThrow(HttpsError);
    expect(() => requireString(null, "field")).toThrow(HttpsError);
  });

  it("throws invalid-argument for an empty string", () => {
    expect(() => requireString("", "field")).toThrow(HttpsError);
  });

  it("throws invalid-argument when the string exceeds the max length", () => {
    expect(() => requireString("a".repeat(10), "field", 5)).toThrow(HttpsError);
  });

  it("accepts a string exactly at the max length boundary", () => {
    expect(requireString("abcde", "field", 5)).toBe("abcde");
  });
});
