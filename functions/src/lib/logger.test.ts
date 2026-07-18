import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger.js";

describe("functions logger", () => {
  const originalLog = console.log;

  beforeEach(() => {
    console.log = vi.fn();
  });
  afterEach(() => {
    console.log = originalLog;
  });

  it("logs an info message with a JSON severity payload (Cloud Logging structured format)", () => {
    logger.info("match content generated", { matchId: "demo-final" });
    expect(console.log).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(payload.severity).toBe("INFO");
    expect(payload.message).toBe("match content generated");
    expect(payload.matchId).toBe("demo-final");
  });

  it("logs a warning with WARNING severity", () => {
    logger.warn("cache miss, regenerating");
    const payload = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(payload.severity).toBe("WARNING");
  });

  it("logs an error with ERROR severity and includes the error's message", () => {
    logger.error("gemini call failed", new Error("boom"));
    const payload = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(payload.severity).toBe("ERROR");
    expect(payload.message).toBe("gemini call failed");
    expect(payload.error).toContain("boom");
  });

  it("still logs an error payload when no Error object is provided", () => {
    logger.error("something failed");
    const payload = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(payload.severity).toBe("ERROR");
    expect(payload.message).toBe("something failed");
  });
});
