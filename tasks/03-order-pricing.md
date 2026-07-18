# Task: functions/src/lib/orderPricing.ts

Target language: TypeScript, strict mode, Node.js 20, `"module": "NodeNext"` — this
file has no relative imports, so extension rules don't apply here.

## Purpose

Security fix: today a fan's order document is written by the CLIENT with a
client-computed `total` (see `src/features/fan/food/placeOrder.ts` in the frontend,
not visible to you). A malicious client could submit any `total` it wants. This
function computes the AUTHORITATIVE order total server-side from the trusted stall
menu, so a Cloud Function trigger can recompute and overwrite the client-submitted
total before the order is accepted.

## Public API (exact signatures — tests call these directly)

```ts
export interface OrderLineRequest {
  itemId: string;
  qty: number;
}

export interface StallMenuItem {
  itemId: string;
  priceCents: number;
}

export function computeOrderTotal(
  lines: OrderLineRequest[],
  menu: StallMenuItem[]
): number;
```

## Behavior requirements

- Returns the sum, over all `lines`, of `qty * priceCents`, where `priceCents` is
  looked up from `menu` by matching `itemId` — NEVER trust any price from `lines`
  itself (the `OrderLineRequest` type deliberately has no price field at all).
- Returns `0` for an empty `lines` array.
- If the same `itemId` appears in multiple lines, sum all of their contributions
  (do not dedupe).
- If any line's `itemId` is not found in `menu`, throw an `Error` (do not silently
  price it as 0, and do not skip that line) — this must happen even if only ONE of
  several lines is missing from the menu.
- Pure function: no I/O, no async, no external dependencies.

## Edge cases (from the test file, verify these exactly)

- `computeOrderTotal([], menu)` returns `0`.
- `computeOrderTotal([{itemId: "taco", qty: 1}], menu)` where menu has
  `{itemId: "taco", priceCents: 650}` returns `650` — the price from the menu is
  used, not any client value (proven structurally: the request type has no price
  field).
- Multiple quantities of the same item multiply correctly (`qty: 5` at 300 cents
  each = 1500).
- A missing `itemId` throws synchronously (`expect(() => ...).toThrow()`), including
  when it's mixed with otherwise-valid lines.
