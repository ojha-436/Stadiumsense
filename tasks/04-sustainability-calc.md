# Task: src/features/fan/sustainability.ts

Target language: TypeScript, strict mode, ES2020+, browser bundle (Vite), no `any`.
Pure calculation module — no React, no I/O, no imports beyond the one type import
below.

## Purpose

Problem-statement alignment: the hackathon brief explicitly calls out "sustainability"
as a dimension the solution should address (alongside navigation, crowd management,
accessibility, transportation, etc.) and this app currently has zero representation
of it. This module estimates the CO2 impact of a fan's chosen transport mode to a
match, to be surfaced as a small insight card on the fan home page.

## Type import

Import `TransportMode` from `"@/types/domain"` — it is already defined there as:
```ts
export type TransportMode = "transit" | "driving" | "walking" | "rideshare";
```
Do not redefine this type yourself; import it.

## Public API (exact signature — tests call this directly)

```ts
export interface SustainabilityEstimate {
  co2SavedKg: number | null;
  treesEquivalent: number | null;
}

export function estimateSustainability(
  transportMode: TransportMode,
  tripDistanceKm?: number
): SustainabilityEstimate;
```

## Behavior requirements

- `tripDistanceKm` defaults to `15` when not supplied (a typical stadium commute
  distance) — calling with no second argument must produce IDENTICAL output to
  calling with `15` explicitly.
- For `"driving"` and `"rideshare"` (both car-based, no savings vs. the baseline
  car trip being estimated against): return `{ co2SavedKg: null, treesEquivalent: null }`.
- For `"transit"` and `"walking"`: return a positive `co2SavedKg` (estimated kg of
  CO2 saved versus driving the same distance) and a `treesEquivalent` (rounded to
  a whole number, using `Math.ceil` or `Math.round` such that it is NEVER `0` when
  there is any positive saving — minimum value `1`).
- `"walking"` must produce a strictly GREATER `co2SavedKg` than `"transit"` for the
  same `tripDistanceKm` (walking replaces the car trip entirely with zero emissions;
  transit still has some emissions per km, so it saves less versus driving).
- A longer `tripDistanceKm` must produce a strictly greater `co2SavedKg` for the
  same mode (linear or near-linear scaling with distance is fine).
- Suggested (not test-enforced) baseline constants you may use: average car
  emissions ~0.192 kg CO2/km, average transit emissions ~0.041 kg CO2/km, walking
  0 kg CO2/km, one tree seedling absorbs ~0.06 kg CO2/day (used only to derive
  `treesEquivalent`, feel free to pick any reasonable public figure as long as the
  behavior requirements above hold).

## Edge cases (from the test file, verify these exactly)

- `estimateSustainability("driving")` → `{ co2SavedKg: null, treesEquivalent: null }`
- `estimateSustainability("rideshare")` → `{ co2SavedKg: null, treesEquivalent: null }`
- `estimateSustainability("transit")` → `co2SavedKg > 0`, `treesEquivalent >= 1`
- `estimateSustainability("walking")` → `co2SavedKg > 0`
- `estimateSustainability("walking", 10).co2SavedKg > estimateSustainability("transit", 10).co2SavedKg`
- `estimateSustainability("transit", 20).co2SavedKg > estimateSustainability("transit", 5).co2SavedKg`
- `estimateSustainability("transit", 0.1).treesEquivalent >= 1` (even a tiny
  distance must round UP to at least 1 tree-equivalent, never 0, whenever there is
  any saving at all)
- `estimateSustainability("transit")` deep-equals `estimateSustainability("transit", 15)`
