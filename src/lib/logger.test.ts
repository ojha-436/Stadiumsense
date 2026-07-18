import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("frontend logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes debug() through console.debug with a recognisable prefix", () => {
    logger.debug("cache hit");
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith(expect.stringContaining("cache hit"), "");
  });

  it("routes info() through console.info", () => {
    logger.info("plan generated");
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it("routes warn() through console.warn", () => {
    logger.warn("falling back to cached content");
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("routes error() through console.error and includes the error object", () => {
    const err = new Error("network down");
    logger.error("Failed to save fan profile", err);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to save fan profile"), err, "");
  });

  it("still logs a message via error() when no error object is supplied", () => {
    logger.error("Something went wrong with no exception object");
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("includes provided context in the console call", () => {
    logger.info("order placed", { orderId: "o1" });
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining("order placed"), { orderId: "o1" });
  });
});
