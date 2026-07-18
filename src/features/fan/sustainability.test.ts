import { describe, expect, it } from "vitest";
import { estimateSustainability } from "./sustainability";

describe("estimateSustainability", () => {
  it("reports no CO2 savings for driving", () => {
    expect(estimateSustainability("driving")).toEqual({ co2SavedKg: null, treesEquivalent: null });
  });

  it("reports no CO2 savings for rideshare (still car travel)", () => {
    expect(estimateSustainability("rideshare")).toEqual({ co2SavedKg: null, treesEquivalent: null });
  });

  it("reports a positive CO2 saving for transit", () => {
    const result = estimateSustainability("transit");
    expect(result.co2SavedKg).not.toBeNull();
    expect(result.co2SavedKg!).toBeGreaterThan(0);
    expect(result.treesEquivalent!).toBeGreaterThanOrEqual(1);
  });

  it("reports a positive CO2 saving for walking", () => {
    const result = estimateSustainability("walking");
    expect(result.co2SavedKg!).toBeGreaterThan(0);
  });

  it("credits walking with a larger saving than transit over the same distance", () => {
    const walking = estimateSustainability("walking", 10);
    const transit = estimateSustainability("transit", 10);
    expect(walking.co2SavedKg!).toBeGreaterThan(transit.co2SavedKg!);
  });

  it("scales the saving up with a longer trip distance", () => {
    const short = estimateSustainability("transit", 5);
    const long = estimateSustainability("transit", 20);
    expect(long.co2SavedKg!).toBeGreaterThan(short.co2SavedKg!);
  });

  it("never reports a tree-equivalent below 1 whenever there is any saving", () => {
    const result = estimateSustainability("transit", 0.1);
    expect(result.treesEquivalent!).toBeGreaterThanOrEqual(1);
  });

  it("uses a sensible default distance when none is supplied", () => {
    const withDefault = estimateSustainability("transit");
    const explicitSame = estimateSustainability("transit", 15);
    expect(withDefault).toEqual(explicitSame);
  });
});
