# StadiumSense — Build Plan

Approach plan for executing [SPEC.md](./SPEC.md) with [ARCHITECTURE.md](./ARCHITECTURE.md).
Rule of the plan: **always demoable** — after every phase the deployed app tells a complete (if smaller) story.

---

## Guiding principles

1. **Rules and data model first.** Firestore security rules are written and emulator-tested before any UI touches a collection — they are the contract *and* the security-rubric evidence.
2. **Fake Gemini in dev/CI, real Gemini behind one interface.** All AI goes through `src/ai/` (client) → Functions `ai/` module. Tests inject a fake; the demo uses Vertex AI. No flaky CI, no burned quota.
3. **Simulator before dashboards.** The ops dashboard is only impressive if data moves; build the pulse service before the screens that watch it.
4. **Ship the golden path, then widen.** Golden path = scan ticket → arrival plan → route → order food → vendor fulfils → ops brief updates → admin revokes vendor. Everything else is decoration around this spine.

## Phase 0 — Foundation (½ day)

- [ ] Firebase project + GCP project, billing, enable APIs (Vertex AI, Maps: Places/Routes/Maps JS, Secret Manager, Cloud Run, Scheduler)
- [ ] Scaffold: Vite + React 18 + TypeScript strict + Tailwind + react-router + react-i18next + Vitest + Testing Library + Playwright
- [ ] Firebase: Auth (email + Google), Firestore, Storage, Hosting, App Check (reCAPTCHA Enterprise), Emulator Suite
- [ ] Repo hygiene: ESLint + Prettier, `.env.example`, GitHub repo, GitHub Actions CI (lint → typecheck → unit → rules tests → build)
- [ ] Seed script: demo match (pick final venue — MetLife/NY-NJ), two teams + lineups, 6 stalls with menus, amenities, zones, gates

**Exit check:** deployed "hello" PWA on Hosting, CI green, emulators run locally.

## Phase 1 — Fan core (2–3 days) → SPEC F1–F6, F10–F12

Order of build (each item lands with its tests + i18n keys + a11y pass):

1. **Auth + roles + rules** — sign-in, `users` doc, custom-claim guard, full rules matrix + emulator rule tests (F12)
2. **Ticket onboarding** — questionnaire path FIRST (pure Firestore, no AI risk), then `parseTicket` scan path with Gemini Vision + confirm screen (F1)
3. **Match hub** — seeded lineups + `getMatchContent` per-language cache (F4)
4. **Arrival planner** — `planArrival` streaming callable + plan card UI (F2)
5. **Route planner** — Places autocomplete + `planRoute` + route cards with crowd labels (F3)
6. **Stalls + order-to-seat** — directory, cart, mock checkout, `onOrderCreated` trigger, live status via listener (F5)
7. **Amenities finder** — SVG stadium zone map + nearest list + live status (F6)
8. **i18n sweep** — EN/ES/FR complete, language picker, missing-key CI check (F10)

**Exit check:** a fan can do everything in the golden path except vendor/ops/admin sides; Lighthouse a11y ≥ 95 on fan screens.

## Phase 2 — Simulator + staff surfaces (1½–2 days) → F7–F9

1. **Pulse simulator** — Cloud Run + Scheduler: gate waves, zone density curves, transit loads, random incidents; "SIMULATED DATA" badge component in UI
2. **Vendor portal** — stall/menu/stock CRUD + live order queue with status transitions (F9)
3. **Ops dashboard** — zone heat view, gate table, incident feed, amenity status toggles, `opsBrief` panel (on-demand + 5-min schedule) (F7)
4. **Admin portal** — `provisionUser` (create/deactivate staff & vendors), role list, basic platform stats (F8)

**Exit check:** full golden path works end-to-end on the deployed app with two browsers side by side (fan + vendor/ops).

## Phase 3 — Delight layer (1–1½ days) → F13–F16 (only if Phase 2 exit passed)

1. **Social wall** — selfie upload → `moderatePost` (Gemini safety + auto alt-text) → per-match feed, player shout-outs (F13)
2. **Prediction polls** — create/vote/live bars, one-vote rule test (F14)
3. **Voice concierge** — mic input (STT) + spoken answers (TTS) on the fan concierge; script this as the accessibility demo moment (F15/F16)

Cut order if time collapses: F16 chat → F15 voice → F13 wall → F14 polls (polls are cheap, keep if possible).

## Phase 4 — Hardening + submission (1 day)

- [ ] Test debt: coverage ≥ 70% functions/lib, all rules paths tested, Playwright golden-path spec green against emulators
- [ ] a11y audit: axe + keyboard-only walkthrough + screen-reader spot check; fix to WCAG 2.1 AA
- [ ] Security pass: bundle scan for secrets, App Check enforced ON, rules deny-by-default review
- [ ] Efficiency pass: route code-splitting, Firestore listener audit (no polling), Gemini cache hit verification, min-instances=1 on `planArrival` + `opsBrief` for judging window
- [ ] README (judge-facing: problem → solution → architecture diagram → rubric mapping table → run instructions), demo video script, HACKATHON.md links filled
- [ ] Deploy freeze + full golden-path rehearsal ×3

## Demo script (target < 4 min)

1. *(ES locale)* Diego scans his ticket → confirm → Gemini plan: "leave 17:40, Gate C, here's why" (30 s)
2. Enters hotel address → two transit routes, one flagged "less crowded" with reasoning (30 s)
3. Match hub: lineups + fun facts in Spanish (15 s)
4. Orders nachos + water to seat 114/R/7 → **switch to vendor screen** → accept → prepare → deliver; fan sees live status (60 s)
5. Amenities: nearest water + toilets; ops closes a toilet block → fan view updates live (20 s)
6. **Ops dashboard:** crowd heat rising at North concourse → Gemini brief recommends opening Gate E (40 s)
7. **Admin:** deactivates a vendor → vendor portal locks out (15 s)
8. Close on rubric slide: languages, a11y score, test count, security rules, 10+ Google services (20 s)

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gemini latency/quota during judging | streaming UI, per-language caching, min instances, fake-mode env flag as last-resort demo fallback |
| Maps Platform billing not enabled in time | enable + test day 1; static fallback route data behind the same interface |
| Scope creep from Phase 3 | hard gate: Phase 2 exit check must pass first; cut order pre-agreed |
| Solo-dev time crunch | golden path is always deployable; every phase ends demoable |
| Ticket images vary wildly | questionnaire path is the guaranteed fallback, built first |
