# StadiumSense — System Architecture

**Status:** Accepted (hackathon v1)
**Date:** 2026-07-10
**Deciders:** Jasbir (owner)
**Inputs:** [SPEC.md](./SPEC.md), [HACKATHON.md](./HACKATHON.md)
**Constraints:** solo/small-team hackathon timeline; must deploy on Firebase + Google Cloud; Gemini mandatory; judged on code quality, testing, security, accessibility, alignment, efficiency.

---

## 1. High-Level Architecture

```
                        ┌───────────────────────────────────────────┐
                        │        ONE React PWA (Vite + TS)          │
                        │  role-routed surfaces on Firebase Hosting  │
                        │  /fan   /ops   /vendor   /admin            │
                        └───────┬───────────────────┬───────────────┘
                                │ Firebase SDK       │ HTTPS (App Check token)
                                ▼                    ▼
              ┌──────────────────────────┐   ┌──────────────────────────────┐
              │  Firebase Auth            │   │  Cloud Functions (2nd gen)    │
              │  email + Google sign-in   │   │  = API + AI gateway           │
              │  custom claims: role      │   │  planArrival / parseTicket /  │
              └──────────────────────────┘   │  planRoute / opsBrief /       │
                                             │  matchFacts / moderatePost /  │
              ┌──────────────────────────┐   │  onOrderCreated (trigger)     │
              │  Firestore (data spine)   │◄──┤  provisionUser (admin)        │
              │  realtime listeners to    │   └──────┬───────────┬───────────┘
              │  all four surfaces        │          │           │
              └────────────▲─────────────┘          ▼           ▼
                           │                ┌──────────────┐ ┌───────────────┐
              ┌────────────┴─────────────┐  │ Gemini 2.5   │ │ Google Maps    │
              │  Crowd Simulator          │  │ Flash        │ │ Platform       │
              │  (Cloud Run + Scheduler)  │  │ (+ Vision)   │ │ Routes/Places  │
              │  zone density, gates,     │  │ via Vertex   │ │ (server-side)  │
              │  transit load, incidents  │  │ Express Mode │ └───────────────┘
              └───────────────────────────┘  └──────────────┘
              └───────────────────────────┘
   Also: Firebase Storage (selfies/tickets) · App Check · Secret Manager ·
   Cloud Scheduler · BigQuery (P1 analytics) · Cloud STT/TTS (P1 voice)
```

**Data flow in one sentence:** clients talk to Firestore directly for reads/realtime (guarded by security rules) and to Cloud Functions for anything involving Gemini, Maps, roles, or money-like writes; the simulator feeds the same Firestore collections the dashboards listen to.

## 2. Google Services Used (and why — judge-facing list)

| Service | Purpose |
|---|---|
| Firebase Hosting | PWA hosting, CDN, preview channels |
| Firebase Auth | identity; custom claims carry roles |
| Cloud Firestore | single realtime data spine for all surfaces |
| Cloud Functions 2nd gen | secure API/AI gateway + Firestore triggers |
| Gemini 2.5 Flash (via Vertex AI Express Mode, `@google/genai`) | ticket parsing, arrival/route reasoning, match facts, ops briefs, moderation, ops chat |
| Google Maps Platform (Places, Routes, Maps JS) | start-location autocomplete, transit routing, route map |
| Cloud Run | crowd/transit simulator service |
| Cloud Scheduler | periodic simulator ticks + periodic ops brief |
| Firebase Storage | ticket images, selfie uploads |
| Firebase App Check | blocks non-app clients from Firestore/Functions |
| Secret Manager | Maps/Gemini server keys |
| BigQuery (P1) | post-match analytics for admin |
| Cloud STT/TTS (P1) | voice concierge (accessibility flagship) |

## 3. Key Decisions (ADRs)

### ADR-1: One React PWA with role-routed surfaces — not four separate apps

| Option | Complexity | Speed | Code quality story |
|---|---|---|---|
| **A. One Vite+React+TS app, role-guarded routes (CHOSEN)** | Low | Fastest | shared design system, one test/CI setup |
| B. Monorepo with 4 apps | Med | Slow | cleaner isolation, overkill for hackathon |
| C. Fan PWA + separate ops app | Med | Medium | two deploys, duplicated auth code |

**Decision:** A. Route groups `/fan`, `/ops`, `/vendor`, `/admin` behind a `RequireRole` guard reading the custom claim. Server-side enforcement lives in Firestore rules, so the client guard is UX, not security.
**Consequence:** one Lighthouse/a11y/i18n effort covers everything; risk is bundle size → mitigate with route-level code splitting.

### ADR-2: Firestore as the only database — no Cloud SQL

**Decision:** Firestore alone. Every rubric-relevant behaviour (live orders, live crowd heat, live amenity status) is a realtime-listener story, which Firestore gives for free and SQL doesn't. Declarative security rules are also the strongest *testable* security artifact a hackathon judge can see (emulator rule tests).
**Trade-off accepted:** no relational joins → denormalise (e.g., stall name copied onto order docs); fine at demo scale.
**Revisit if:** analytics queries get heavy → export to BigQuery (already planned P1).

### ADR-3: All AI/Maps calls server-side via Cloud Functions (never from the browser)

| Option | Security | Latency | Efficiency |
|---|---|---|---|
| **A. Functions gateway (CHOSEN)** | key in Secret Manager, App Check-gated | +100–300 ms | enables shared caching |
| B. Client-side Gemini API key | key extractable from bundle → fails security rubric | best | none |
| C. Cloud Run API for everything | fine | fine | more infra to maintain than needed |

**Decision:** A. Callable Functions (`httpsCallable`) with App Check enforcement. Gemini access is via **Vertex AI Express Mode** (`@google/genai`, `vertexai: true` + an API key) rather than full ADC/service-account auth — the key is bound from Secret Manager via each function's `secrets` option and injected into the runtime environment; it is never present in source, `.env` files, or the client bundle.
**Consequence:** zero secrets in the client bundle — a demoable security claim — while still keeping the API key itself out of source control and off the wire to the browser.

### ADR-4: Gemini model choice + caching strategy (efficiency rubric)

- **Model:** `gemini-2.5-flash` for every call (ticket Vision parsing, route ranking, chat/concierge, moderation, arrival planning, ops briefs). `GEMINI_FLASH_MODEL`/`GEMINI_PRO_MODEL` remain two separate config vars so splitting reasoning-heavy calls onto a heavier tier later is a one-line config change, not a code change.
- **Cache aggressively in Firestore:** match facts/lineups generated **once per match per language** (`matches/{id}/content/{lang}`), not per user. Arrival plans cached per (section, startArea, language) bucket with 15-min TTL. Ops briefs generated on schedule (every 5 min) + on demand, shared by all ops viewers.
**Consequence:** demo stays fast and cheap; "we cache Gemini output per language, not per request" is a strong efficiency answer in judging Q&A.

### ADR-5: Crowd/transit data = Cloud Run simulator writing to Firestore

**Decision:** a small Cloud Run service ("pulse") driven by Cloud Scheduler generates realistic time-parameterised data: gate arrival waves (peaking 60–90 min pre-kickoff), zone densities, transit line loads, and occasional incident events. It writes to the same collections real sensors would, so **swapping in real data later changes zero application code**.
**Why not fake data client-side:** judges inspect code; a real service emitting into the real spine is honest architecture, labelled as simulation in the UI.

### ADR-6: i18n — static strings via i18next, generated content via Gemini per-language cache

**Decision:** `react-i18next` with EN/ES/FR resource files for all UI strings (testable: CI check for missing keys). Gemini is always prompted with the target language and results cached per language (ADR-4). No Cloud Translation API round-trip on Gemini output — Gemini is natively multilingual; one less hop (efficiency).

### ADR-7: Roles via Auth custom claims + Firestore rules (admin provisioning)

**Decision:** `provisionUser` callable (admin-only) sets `role` custom claim and writes a `users/{uid}` profile doc. Rules read `request.auth.token.role`. Deactivation flips claim + doc flag; client forces token refresh on `users/{uid}` change.
**Rule matrix (enforced + emulator-tested):**

| Collection | fan | vendor | ops | admin |
|---|---|---|---|---|
| `users/{uid}` | read own | read own | read own | read/write all |
| `matches`, `stalls`, `amenities`, `zones` | read | read (write own stall) | read + write amenity status | read/write |
| `orders` | create + read own | read/update where `stallId == token.stallId` | read all | read all |
| `incidents` | create (report) + read own | — | read/write | read/write |
| `posts`, `polls` (P1) | create + read; vote once | read | read | moderate/delete |
| `simulator/*` (crowd, transit) | read summary | — | read all | read all |

### ADR-8: Testing pyramid matched to the rubric

- **Unit (Vitest):** planners' prompt-builders, parsers, utils, components (Testing Library).
- **Integration (Firebase Emulator Suite):** security-rules tests (the security rubric's proof), Functions tests with mocked Gemini client.
- **E2E (Playwright):** golden path — onboard → plan → order → vendor fulfil → ops brief.
- **CI (GitHub Actions):** lint + typecheck + unit + rules tests + build on every push; deploy on main.
Gemini calls are wrapped in one `ai/` module with an interface, so tests inject a fake — no flaky/expensive API calls in CI.

## 4. Data Model (Firestore)

```
users/{uid}                 role, displayName, lang, active, stallId?, section?
fanProfiles/{uid}           matchId, seat{section,row,seat}, gate, startLocation,
                            transportMode, accessibilityNeeds[], partySize
matches/{matchId}           teams, kickoff, stadiumId, venue, lineups{home[],away[]}
matches/{matchId}/content/{lang}   facts[], preview, generatedAt   ← Gemini cache
stalls/{stallId}            name, zone, vendorUid, open, menu[{itemId,name,price,stock,soldOut}]
orders/{orderId}            fanUid, stallId, matchId, items[], seat, status,
                            timeline[{status,at}], total   (status: placed→accepted→
                            preparing→delivering→delivered / cancelled)
amenities/{amenityId}       type(water|toilet|firstaid), zone, location, status
zones/{zoneId}              name, densityPct, trend, updatedAt      ← simulator
gates/{gateId}              throughput, queueMins, status           ← simulator
transitLines/{lineId}       loadPct, headwayMins                    ← simulator
incidents/{incidentId}      type, zone, source(fan|simulator|ops), severity,
                            description, photoUrl?, status, geminiTriage?
opsBriefs/{briefId}         matchId, summary, actions[], dataSnapshot, createdAt, lang
plans/{planKey}             arrival-plan cache: key=hash(section,startArea,lang), ttl
posts/{postId}   (P1)       fanUid, imageUrl, caption, playerTag, moderation, matchId
polls/{pollId}   (P1)       question, options[], counts{}, createdBy
polls/{pollId}/votes/{uid}  optionId                                ← one vote/user
```

## 5. Function Inventory (Cloud Functions 2nd gen, TypeScript)

| Function | Type | Does |
|---|---|---|
| `parseTicket` | callable | Storage image → Gemini Vision → structured ticket fields |
| `planArrival` | callable (streaming) | profile + crowd forecast → leave-by time, gate, reasoning |
| `planRoute` | callable | Places/Routes candidates + transit load → ranked routes w/ explanations |
| `getMatchContent` | callable | per-language cached facts/lineups; generates on first miss |
| `opsBrief` | callable + scheduled | snapshot zones/gates/incidents → Gemini brief + actions |
| `onOrderCreated` | Firestore trigger | validate stock, decrement, denormalise stall name, notify vendor queue |
| `provisionUser` | callable (admin) | create/deactivate user, set role claim, optional stallId |
| `moderatePost` (P1) | Storage/Firestore trigger | Gemini safety check + alt-text caption before publish |

## 6. Consequences

**Easier:** one deploy target (`firebase deploy`), one design system, all realtime UX free via listeners, security demonstrable with rule tests, real→simulated data swap needs no app changes, multi-stadium later (everything keyed by `matchId`/`stadiumId`).
**Harder:** no SQL joins (denormalising discipline needed), Functions cold starts (mitigate: min instances = 1 on the two demo-critical functions during judging), single app bundle growth (route code-splitting).
**Revisit later:** FCM push notifications, BigQuery export pipeline, real ticketing/payment providers.

## 7. Action Items

1. [ ] Scaffold Vite + React + TS + Tailwind + react-i18next + Firebase SDK; ESLint/Prettier/strict TS
2. [ ] Firebase project: Auth, Firestore, Storage, App Check, Hosting; emulator suite config
3. [ ] Security rules + emulator rule tests (write rules FIRST — they define the data model contract)
4. [ ] Functions skeleton with `ai/` gateway module (interface + Gemini impl + fake impl for tests)
5. [ ] Simulator service on Cloud Run + Scheduler
6. [ ] Build order per SPEC phasing (fan core → ops/vendor/admin → social/voice → hardening)
7. [ ] CI: GitHub Actions (lint, typecheck, unit, rules tests, build, deploy)
