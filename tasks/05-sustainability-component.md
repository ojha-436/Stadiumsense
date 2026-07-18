# Task: src/features/fan/components/SustainabilityInsight.tsx

Target language: TypeScript + React 18 function component (`.tsx`), strict mode, no
`any`. Follow the same structural conventions as this codebase's other small fan
"insight card" components.

## Purpose

Renders the fan's estimated travel sustainability impact (CO2 saved, tree
equivalent) as a small card on the fan home page, using the `estimateSustainability`
calculation from `src/features/fan/sustainability.ts` (already implemented, passed
to you as context) and the `transportMode` already stored on the fan's profile.

## Imports available to you (match these exactly — do not invent different paths)

```tsx
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";
import type { FanProfile } from "@/types/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { estimateSustainability } from "../sustainability";
```

`Card`, `CardHeader`, `CardTitle` are existing UI primitives — `CardHeader` is a
flex row meant to contain an icon + `CardTitle`; `CardTitle` renders a heading.
Use them exactly like this existing example from a sibling component:
```tsx
<Card>
  <CardHeader>
    <Navigation className="h-5 w-5 text-flag-blue" aria-hidden="true" />
    <CardTitle>{t("route.title")}</CardTitle>
  </CardHeader>
  {/* ...body... */}
</Card>
```

## i18n keys already added (in `src/i18n/locales/en.json` under `"sustainability"`,
translated equivalents exist in es.json/fr.json — use react-i18next interpolation
syntax `{{varName}}`, do not hardcode English strings)

```json
"sustainability": {
  "title": "Your travel impact",
  "transitOrWalking": "Choosing {{mode}} instead of driving saves an estimated {{co2}} kg of CO₂ for this trip.",
  "driving": "No emissions savings estimated — you're driving. Public transit or walking for your next matchday can cut this footprint.",
  "treesEquivalent": "That's about the same as what {{trees}} tree seedlings absorb in a day.",
  "modeTransit": "public transit",
  "modeWalking": "walking",
  "modeRideshare": "rideshare"
}
```

## Component contract

```tsx
export function SustainabilityInsight({ profile }: { profile: FanProfile }): JSX.Element;
```

## Behavior requirements

- Call `estimateSustainability(profile.transportMode)` (no second argument — use
  the calculation's own default distance).
- Render a `Card` with a `CardHeader` containing a `Leaf` icon
  (`className="h-5 w-5 text-flag-green"`, `aria-hidden="true"` — if `text-flag-green`
  does not exist as a Tailwind class in this project, use `text-flag-gold` instead,
  matching the existing pattern of flag-colored accent icons) and
  `<CardTitle>{t("sustainability.title")}</CardTitle>`.
- If `co2SavedKg` is `null` (driving or rideshare): render
  `t("sustainability.driving")` as a paragraph, nothing else.
- If `co2SavedKg` is NOT `null` (transit or walking): render
  `t("sustainability.transitOrWalking", { mode: t(<mode key>), co2: co2SavedKg.toFixed(1) })`
  where `<mode key>` is `"sustainability.modeTransit"` when
  `profile.transportMode === "transit"` and `"sustainability.modeWalking"` when
  `profile.transportMode === "walking"`. Below that paragraph, also render
  `t("sustainability.treesEquivalent", { trees: treesEquivalent })`.
- Use Tailwind utility classes consistent with sibling components (e.g.
  `text-sm text-night-50/90` for body paragraphs, `mt-1` / `mt-2` for spacing
  between stacked paragraphs) — match the visual density of `RoutePlanner.tsx`'s
  body text, do not invent a wildly different visual style.
- No local state, no `useEffect`, no data fetching — this is a pure presentational
  component driven entirely by `profile` and the calculation function.
- Export ONLY `SustainabilityInsight` — no default export, no other named exports.
