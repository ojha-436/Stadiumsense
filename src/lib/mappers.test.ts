import { describe, expect, it } from "vitest";
import { mapOrder, mapStall, mapZone, toMillis } from "./mappers";

describe("toMillis", () => {
  it("passes through numbers", () => {
    expect(toMillis(1234)).toBe(1234);
  });
  it("reads Firestore Timestamp-like objects", () => {
    expect(toMillis({ toMillis: () => 9999 })).toBe(9999);
  });
  it("defaults to 0 for missing values", () => {
    expect(toMillis(undefined)).toBe(0);
  });
});

describe("mappers fill safe defaults", () => {
  it("mapStall defaults open=true and empty menu", () => {
    const stall = mapStall("s1", { name: "Tacos", matchId: "m", zone: "North" });
    expect(stall).toMatchObject({ id: "s1", name: "Tacos", open: true, menu: [] });
  });

  it("mapOrder defaults status to placed and coerces items to a list", () => {
    const order = mapOrder("o1", { fanUid: "u1", stallId: "s1", items: "not-a-list" });
    expect(order.status).toBe("placed");
    expect(order.items).toEqual([]);
  });

  it("mapZone clamps to numeric density even with bad input", () => {
    const zone = mapZone("z1", { name: "North", densityPct: "nope" });
    expect(zone.densityPct).toBe(0);
    expect(zone.trend).toBe("steady");
  });
});
