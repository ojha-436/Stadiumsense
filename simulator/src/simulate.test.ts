import { describe, expect, it } from "vitest";
import { arrivalIntensity, maybeIncident, nextGate, nextTransit, nextZone } from "./simulate.js";

describe("arrivalIntensity", () => {
  it("is low well before kick-off", () => {
    expect(arrivalIntensity(200)).toBe(0.15);
  });
  it("rises in the 90-150 minute window", () => {
    expect(arrivalIntensity(100)).toBe(0.45);
  });
  it("peaks in the 45-90 minute pre-kickoff window", () => {
    expect(arrivalIntensity(60)).toBe(1.0);
  });
  it("eases as kick-off approaches", () => {
    expect(arrivalIntensity(20)).toBe(0.7);
  });
  it("tapers for late arrivals just after kick-off", () => {
    expect(arrivalIntensity(-10)).toBe(0.25);
  });
  it("is lowest well after kick-off", () => {
    expect(arrivalIntensity(-30)).toBe(0.05);
  });
});

describe("nextZone", () => {
  const zone = { densityPct: 30, capacity: 22000, trend: "steady" as const };

  it("keeps density within the 0-100 bound", () => {
    const result = nextZone("z1", { ...zone, densityPct: 95 }, 60, 1);
    expect(result.densityPct).toBeGreaterThanOrEqual(0);
    expect(result.densityPct).toBeLessThanOrEqual(100);
  });

  it("is deterministic for the same id/tick/minutesToKickoff (no Math.random)", () => {
    const a = nextZone("z1", zone, 60, 5);
    const b = nextZone("z1", zone, 60, 5);
    expect(a).toEqual(b);
  });

  it("preserves the zone's other fields (capacity)", () => {
    const result = nextZone("z1", zone, 60, 1);
    expect(result.capacity).toBe(zone.capacity);
  });

  it("only reports rising/falling/steady as the trend", () => {
    const result = nextZone("z1", zone, 60, 1);
    expect(["rising", "falling", "steady"]).toContain(result.trend);
  });
});

describe("nextGate", () => {
  const gate = { queueMins: 5, throughputPerMin: 40, status: "open" as const };

  it("forces a closed gate's queue to zero regardless of intensity", () => {
    const result = nextGate("g1", { ...gate, status: "closed" }, 60, 1);
    expect(result.queueMins).toBe(0);
  });

  it("never returns a negative queue for an open gate", () => {
    for (let tick = 0; tick < 20; tick++) {
      const result = nextGate("g1", gate, 200, tick);
      expect(result.queueMins).toBeGreaterThanOrEqual(0);
    }
  });

  it("is deterministic for the same inputs", () => {
    expect(nextGate("g1", gate, 60, 3)).toEqual(nextGate("g1", gate, 60, 3));
  });
});

describe("nextTransit", () => {
  const line = { loadPct: 40, headwayMins: 6 };

  it("keeps load within the 0-100 bound", () => {
    for (let tick = 0; tick < 20; tick++) {
      const result = nextTransit("t1", line, 45, tick);
      expect(result.loadPct).toBeGreaterThanOrEqual(0);
      expect(result.loadPct).toBeLessThanOrEqual(100);
    }
  });

  it("preserves headwayMins unchanged", () => {
    const result = nextTransit("t1", line, 60, 1);
    expect(result.headwayMins).toBe(line.headwayMins);
  });
});

describe("maybeIncident", () => {
  it("never raises an incident below the density threshold", () => {
    for (let tick = 0; tick < 30; tick++) {
      expect(maybeIncident("z1", "North Concourse", 50, tick)).toBeNull();
    }
  });

  it("can raise an incident at very high, sustained density", () => {
    const incidents = Array.from({ length: 50 }, (_, tick) =>
      maybeIncident("z1", "North Concourse", 95, tick)
    ).filter((incident) => incident !== null);
    expect(incidents.length).toBeGreaterThan(0);
    expect(incidents.every((incident) => incident?.severity === "high")).toBe(true);
  });

  it("labels a 82-90% density incident as medium severity, not high", () => {
    const incidents = Array.from({ length: 50 }, (_, tick) =>
      maybeIncident("z1", "North Concourse", 85, tick)
    ).filter((incident) => incident !== null);
    if (incidents.length > 0) {
      expect(incidents.every((incident) => incident?.severity === "medium")).toBe(true);
    }
  });
});
