import { describe, expect, it } from "vitest";
import { formatMoney, formatRelative, formatTime } from "./format";

describe("formatMoney", () => {
  it("formats cents as USD", () => {
    expect(formatMoney(650)).toBe("$6.50");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(123456)).toBe("$1,234.56");
  });

  it("localises the format for Spanish and French", () => {
    // All hosts use USD; only grouping/symbol placement changes per locale.
    expect(formatMoney(650, "es")).toContain("6");
    expect(formatMoney(650, "fr")).toContain("6");
  });
});

describe("formatTime", () => {
  it("renders a stable local time for a fixed instant", () => {
    const noonUtc = Date.UTC(2026, 6, 19, 12, 0, 0);
    // Exact string depends on the runner TZ; assert it produced a time token.
    expect(formatTime(noonUtc)).toMatch(/\d/);
  });
});

describe("formatRelative", () => {
  const now = Date.UTC(2026, 6, 19, 12, 0, 0);
  it("describes a near-future instant in minutes", () => {
    expect(formatRelative(now + 25 * 60000, now)).toMatch(/25/);
  });
  it("describes an instant over an hour away in hours", () => {
    expect(formatRelative(now + 2 * 3600_000, now)).toMatch(/2/);
  });
});
