import { describe, expect, it } from "vitest";
import { computeOrderTotal } from "./orderPricing.js";

const menu = [
  { itemId: "taco", priceCents: 650 },
  { itemId: "soda", priceCents: 300 },
];

describe("computeOrderTotal", () => {
  it("sums qty * priceCents across all order lines using the real menu price", () => {
    expect(
      computeOrderTotal(
        [
          { itemId: "taco", qty: 2 },
          { itemId: "soda", qty: 1 },
        ],
        menu
      )
    ).toBe(2 * 650 + 300);
  });

  it("returns 0 for an empty line list", () => {
    expect(computeOrderTotal([], menu)).toBe(0);
  });

  it("uses the authoritative menu price regardless of any client-side price", () => {
    // The function's input type has no price field at all — this is the point:
    // total is derived only from the trusted server-side menu, never a client value.
    expect(computeOrderTotal([{ itemId: "taco", qty: 1 }], menu)).toBe(650);
  });

  it("handles multiple quantities of the same item", () => {
    expect(computeOrderTotal([{ itemId: "soda", qty: 5 }], menu)).toBe(1500);
  });

  it("throws when a line references an item absent from the menu", () => {
    expect(() => computeOrderTotal([{ itemId: "missing-item", qty: 1 }], menu)).toThrow();
  });

  it("throws rather than silently pricing a missing item at zero", () => {
    expect(() =>
      computeOrderTotal([{ itemId: "taco", qty: 1 }, { itemId: "missing-item", qty: 1 }], menu)
    ).toThrow();
  });
});
