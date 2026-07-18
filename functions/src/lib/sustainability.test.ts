import { describe, expect, it } from "vitest";
import { co2SavedVsDrivingKg, sustainabilityPromptLine } from "./sustainability.js";

describe("co2SavedVsDrivingKg", () => {
  it("returns a positive saving for transit", () => {
    expect(co2SavedVsDrivingKg("transit")!).toBeGreaterThan(0);
  });

  it("credits walking with a larger saving than transit over the same distance", () => {
    expect(co2SavedVsDrivingKg("walking", 12)!).toBeGreaterThan(co2SavedVsDrivingKg("transit", 12)!);
  });

  it("returns null for car travel (driving and rideshare)", () => {
    expect(co2SavedVsDrivingKg("driving")).toBeNull();
    expect(co2SavedVsDrivingKg("rideshare")).toBeNull();
  });

  it("scales with distance", () => {
    expect(co2SavedVsDrivingKg("transit", 30)!).toBeGreaterThan(co2SavedVsDrivingKg("transit", 10)!);
  });

  it("uses a 15 km default distance", () => {
    expect(co2SavedVsDrivingKg("transit")).toBe(co2SavedVsDrivingKg("transit", 15));
  });
});

describe("sustainabilityPromptLine", () => {
  it("praises a low-carbon choice with a concrete figure for transit", () => {
    const line = sustainabilityPromptLine("transit");
    expect(line).not.toBe("");
    expect(line).toMatch(/\d/);
    expect(line.toLowerCase()).toContain("co");
  });

  it("suggests transit with a concrete potential saving when driving", () => {
    const line = sustainabilityPromptLine("driving");
    expect(line).not.toBe("");
    expect(line).toMatch(/\d/);
    expect(line.toLowerCase()).toMatch(/transit|public/);
  });

  it("returns an empty string for an unknown transport mode (no fabricated line)", () => {
    expect(sustainabilityPromptLine("teleport")).toBe("");
  });

  it("uses the 15 km default distance", () => {
    expect(sustainabilityPromptLine("transit")).toBe(sustainabilityPromptLine("transit", 15));
  });
});
