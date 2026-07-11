import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { MenuItem, Stall } from "@/types/domain";
import { useCart } from "./useCart";

const stall = (id: string): Stall => ({
  id,
  matchId: "m",
  name: `Stall ${id}`,
  zone: "North",
  vendorUid: "v",
  open: true,
  menu: [],
});
const item = (itemId: string, priceCents: number): MenuItem => ({
  itemId,
  name: itemId,
  priceCents,
  stock: 10,
  soldOut: false,
  veg: false,
});

describe("useCart", () => {
  it("adds items and accumulates quantity and total", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.add(stall("a"), item("taco", 650)));
    act(() => result.current.add(stall("a"), item("taco", 650)));
    expect(result.current.count).toBe(2);
    expect(result.current.totalCents).toBe(1300);
    expect(result.current.stallId).toBe("a");
  });

  it("removing decrements then drops the line at zero", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.add(stall("a"), item("taco", 650)));
    act(() => result.current.remove("taco"));
    expect(result.current.count).toBe(0);
    expect(result.current.lines).toHaveLength(0);
  });

  it("switching to a different stall resets the cart", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.add(stall("a"), item("taco", 650)));
    act(() => result.current.add(stall("b"), item("dog", 700)));
    expect(result.current.stallId).toBe("b");
    expect(result.current.count).toBe(1);
    expect(result.current.totalCents).toBe(700);
  });

  it("clear empties the cart", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.add(stall("a"), item("taco", 650)));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
    expect(result.current.stallId).toBeNull();
  });
});
