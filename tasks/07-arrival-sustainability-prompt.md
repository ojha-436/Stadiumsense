# Task: functions/src/lib/sustainability.ts

Target language: TypeScript, strict mode, Node.js 20, `"module": "NodeNext"`. This
file has no relative imports, so extension rules don't apply. Pure module — no I/O,
no async, no external dependencies.

## Purpose

Server-side sustainability estimate used to enrich the Gemini arrival-plan prompt
with a grounded CO₂ figure, so the model's advice is sustainability-aware (a domain
the FIFA World Cup 2026 brief names explicitly) instead of the number being
hallucinated. Mirrors the emission constants used by the frontend
`src/features/fan/sustainability.ts` so both sides agree.

## Strict lint / type requirements (the build fails on these — obey exactly)

- NEVER use `any`. Type everything precisely.
- Every exported function MUST have an explicit return type annotation
  (`@typescript-eslint/explicit-module-boundary-types` is an error here).
- No unused variables or parameters.
- Prefer `const`; no `let` that is never reassigned.
- `noUncheckedIndexedAccess` is ON. Do NOT store the emission rates in a
  `Record<string, number>` and read them with index/dot access — that yields
  `number | undefined` and breaks the arithmetic. Declare each rate as its own
  plain `const number` (e.g. `const CAR_KG_PER_KM = 0.192;`) and use those
  variables directly.

## ASCII-ONLY output (critical)

The returned sentences are sent to the model as a prompt string. Use ONLY plain
ASCII characters in every returned string. Specifically:
- Write the gas as `CO2` (capital C, capital O, digit 2) — NOT `CO₂`, no subscript.
- Do NOT use em dashes (`—`), en dashes (`–`), curly quotes, or any non-ASCII
  punctuation anywhere in the returned strings. Use a plain period or a regular
  hyphen `-` with spaces around it to join clauses.

## Emission constants (module-level named `const number` values, kg CO2 per km)

- car (driving/rideshare baseline): `0.192`
- transit: `0.041`
- walking: `0`

Default trip distance when none supplied: `15` km.

## Public API (exact signatures — tests import these by these names)

```ts
export function co2SavedVsDrivingKg(
  transportMode: string,
  tripDistanceKm?: number
): number | null;

export function sustainabilityPromptLine(
  transportMode: string,
  tripDistanceKm?: number
): string;
```

## Behavior: `co2SavedVsDrivingKg`

Returns the kg of CO₂ the fan saves versus driving the same distance:
- `"transit"`  → `(0.192 - 0.041) * distance` (a positive number)
- `"walking"`  → `0.192 * distance` (a positive number, larger than transit at the
  same distance because walking emits nothing)
- `"driving"` or `"rideshare"` → `null` (they ARE the car baseline, no saving)
- any other/unknown string → `null`
- `tripDistanceKm` defaults to `15`; calling with no distance MUST equal calling
  with `15` explicitly (return the raw computed number, do not round inside this
  function so the default-equals-15 test holds exactly).

## Behavior: `sustainabilityPromptLine`

Returns ONE short instruction sentence to append to the Gemini prompt, telling the
model to weave a sustainability note into its reasoning. Round the figure to one
decimal (`.toFixed(1)`) inside the sentence.

- transit / walking (there IS a saving): a praise line (ASCII only), e.g.
  `"The fan is travelling by <mode>, a low-carbon choice saving about <X> kg of CO2 versus driving. Acknowledge and encourage this in one short sentence of the reasoning."`
  where `<mode>` is the human phrase: `"public transit"` for transit, `"walking"`
  for walking. `<X>` is `co2SavedVsDrivingKg(...)!.toFixed(1)`.
- driving / rideshare (no saving): a suggestion line (ASCII only) that computes the
  POTENTIAL transit saving `(0.192 - 0.041) * distance` and phrases it as, e.g.
  `"The fan is arriving by car. In one short sentence of the reasoning, gently note that taking public transit for this trip could save about <Y> kg of CO2."`
  where `<Y>` is that potential figure `.toFixed(1)`.
- any other/unknown transport mode → return `""` (empty string — never fabricate a
  line for a mode you don't recognize).

## Edge cases (from the test file — verify exactly)

- `co2SavedVsDrivingKg("transit") > 0`
- `co2SavedVsDrivingKg("walking", 12) > co2SavedVsDrivingKg("transit", 12)`
- `co2SavedVsDrivingKg("driving")` and `co2SavedVsDrivingKg("rideshare")` are `null`
- `co2SavedVsDrivingKg("transit", 30) > co2SavedVsDrivingKg("transit", 10)`
- `co2SavedVsDrivingKg("transit")` deep-equals `co2SavedVsDrivingKg("transit", 15)`
- `sustainabilityPromptLine("transit")` is non-empty, contains a digit, and contains
  the substring `"CO"` (case-insensitive `"co"` — the CO₂ token satisfies this)
- `sustainabilityPromptLine("driving")` is non-empty, contains a digit, and contains
  `"transit"` or `"public"`
- `sustainabilityPromptLine("teleport")` is `""`
- `sustainabilityPromptLine("transit")` equals `sustainabilityPromptLine("transit", 15)`
