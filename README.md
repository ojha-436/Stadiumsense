# StadiumSense — FIFA World Cup 2026 Matchday Companion

**Virtual PromptWar (Google × Hack2skill) — GenAI for stadium operations & tournament experience**

StadiumSense is a multilingual (English / Spanish / French) GenAI companion for the FIFA World Cup 2026, built on Google Firebase + Google Cloud with **Google Gemini** at its core. One shared realtime data spine powers four role-based surfaces:

| Surface | Who | What it does |
|---|---|---|
| **Fan PWA** | Ticket holders | Scan ticket (Gemini Vision) or answer a short questionnaire → Gemini recommends the best **arrival time + entry gate** and the **least-crowded transit route** from home; browse **match facts & line-ups**; **order food to your seat**; find **water/restrooms**; post to the **fan wall** and vote in **prediction polls**. |
| **Ops dashboard** | Venue staff | Live crowd-density heat, gate queues, transit load, and incidents — with an on-demand **Gemini situation brief** and recommended actions. |
| **Vendor portal** | Food vendors | Live order queue + menu/stock management; stock updates reach fans instantly. |
| **Admin console** | Organizers | Provision & deactivate staff/vendor accounts with role-scoped access. |

> **Note on demo data:** crowd, gate, and transit figures come from a labelled Cloud Run **simulator** (no real stadium sensors exist to us). It writes the same Firestore documents real sensors would, so swapping in live data is a config change, not a code change.

---

## 🔗 Live deployment

| | |
|---|---|
| **Deployed app** | **https://promptwar-501405.web.app** |
| **Admin panel** | **https://promptwar-501405.web.app/admin** — access key: **`2026-Fifa`** |
| **GCP / Firebase project** | `promptwar-501405` |

The admin panel is gated by a digital access key (client-side gate, default shown above — see [SECURITY.md](SECURITY.md) for its threat-model caveat and how to change it via `VITE_ADMIN_KEY`). Once past the gate, an account still needs the `admin` custom claim to use admin features — see [docs/HACKATHON.md](docs/HACKATHON.md) for the current scope/decisions log.

---

## How it maps to the six judging parameters

| Parameter | How StadiumSense scores |
|---|---|
| **Code quality** | TypeScript **strict** everywhere (`noUncheckedIndexedAccess`, `noImplicitReturns`), ESLint + Prettier clean (0 warnings), feature-sliced architecture, a single typed **domain model** shared across UI and Cloud Functions, all AI behind one **`AiGateway` interface**, zero `any` in app code. |
| **Testing** | Vitest unit tests (i18n key-parity, cart reducer, formatters, mappers, accessible `Field`), Cloud Functions tests (Gemini gateway logic), **Firebase-emulator security-rules tests** (executable proof of the access model), and a Playwright e2e smoke — all wired into GitHub Actions CI. |
| **Security** | Role-based **Firestore security rules** (deny-by-default) + **Storage rules**, roles as **Auth custom claims** set only by an admin-only function, **App Check** enforced on every callable, **all Gemini/Maps calls server-side** (no third-party key in the browser), hardened **CSP** + security headers, CSPRNG temp passwords, deactivation revokes refresh tokens. |
| **Accessibility** | WCAG 2.1 AA intent: semantic landmarks, skip link, programmatically-associated labels/errors (`Field`), `role=meter`/`status`/`alert`, keyboard-complete flows, visible focus rings, reduced-motion support, colour never the sole signal, Gemini-generated **alt text** for fan photos, and full **EN/ES/FR** localisation. |
| **Problem-statement alignment** | Directly covers navigation, crowd management, accessibility, transportation, multilingual assistance, operational intelligence, and real-time decision support — the exact domains named in the brief. |
| **Efficiency** | Gemini **2.5 Flash** for every AI call, per-language **caching** of match content and arrival plans (one generation shared by thousands of fans), realtime **Firestore listeners** instead of polling, route-level **code-splitting** (the fan bundle never ships ops/vendor/admin code). |

---

## Google Cloud & Firebase services used

Firebase Hosting · Firebase Auth · Cloud Firestore · Cloud Functions (2nd gen) · **Gemini 2.5 Flash (Vertex AI Express Mode, multimodal Vision)** · Google Maps Platform (Routes/Places) · Cloud Run (simulator) · Cloud Scheduler · Firebase Storage · Firebase App Check · Secret Manager · BigQuery (planned analytics).

## Architecture

```
      React PWA (Vite + TS)  ──►  Firebase Auth (custom-claim roles)
      /fan /ops /vendor /admin
            │   │
   realtime │   │ callable (App Check)
            ▼   ▼
   Cloud Firestore ◄── Cloud Functions ──► Gemini 2.5 Flash (Vertex AI Express Mode)
        ▲                 │           └──► Google Maps Platform
        │                 └─ triggers: onOrderCreated, onPostCreated (Gemini
        │                    moderation + alt text), onVoteCreated
   Cloud Run simulator (Cloud Scheduler) writes zones/gates/transit/incidents
```

Full detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Spec: [docs/SPEC.md](docs/SPEC.md) · Plan: [docs/PLAN.md](docs/PLAN.md)

## Project structure

```
src/                 Frontend (feature-sliced)
  components/ui/      Accessible design system (Button, Card, Field, …)
  features/           auth · fan · ops · vendor · admin
  i18n/               en / es / fr locales + parity test
  lib/                firebase init, api client, mappers, hooks, format
  types/              domain model + callable contracts (shared)
functions/           Cloud Functions — ai/ gateway (gemini + fake), callables, triggers
simulator/           Cloud Run crowd/transit simulator
scripts/seed.ts      Idempotent demo-data seeder
test/rules/          Firestore security-rules tests (emulator)
e2e/                 Playwright smoke
```

## Instant offline preview (no backend)

To explore the whole app on localhost with zero setup — no Firebase, no Java, no
cloud — run **demo mode**. It serves the real UI against an in-memory data store,
mocked auth, and a client port of the Gemini fake gateway; a role switcher in the
header lets you preview the fan, vendor, ops, and admin surfaces.

```bash
npm install
npm run demo            # dev server with hot reload (http://localhost:5173)
# or a production-style preview:
npm run preview:demo    # builds + serves at http://127.0.0.1:4173
```

Demo mode is gated behind `VITE_DEMO` (see `.env.demo`) and is completely isolated
from the production code paths under `src/lib/demo/`.

## Local development (against Firebase)

Prerequisites: Node 20+, Java 21+ (for the Firebase emulators), Firebase CLI.

```bash
npm install
npm --prefix functions install

# 1) copy env and fill with your Firebase web config
cp .env.example .env.local

# 2) start the emulator suite (Auth, Firestore, Functions, Storage)
npm run emulators

# 3) in another shell: seed demo data into the emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed

# 4) run the app against emulators
VITE_USE_EMULATORS=true npm run dev
```

## Quality gates

```bash
npm run lint          # eslint, 0 warnings
npm run typecheck     # tsc --noEmit (strict)
npm test              # vitest unit tests
npm run test:rules    # security-rules tests (needs emulator + Java)
npm --prefix functions test
npm run build         # production build
npm run test:e2e      # Playwright smoke (needs a preview server)
```

CI runs all of the above on every push — see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Deployment (Google Cloud + Firebase)

```bash
# One-time: store the Gemini API key in Secret Manager (never in source/.env).
# The secret name MUST match the env var name exactly (case-sensitive) —
# see functions/src/lib/secrets.ts — or the function silently gets no value.
firebase functions:secrets:set GEMINI_API_KEY --data-file=-
# (or: printf '%s' "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
#  followed by an IAM grant — `firebase functions:secrets:set` does both for you)

# Cloud Functions (each AI-using function declares `secrets: [GEMINI_API_KEY]`
# individually — a global `secrets` entry in setGlobalOptions does NOT reliably
# bind secrets to 2nd-gen functions, so don't rely on that shortcut)
firebase deploy --only functions

# Hosting (frontend)
npm run build && firebase deploy --only hosting

# Firestore & Storage rules + indexes
firebase deploy --only firestore,storage

# Simulator to Cloud Run + a Cloud Scheduler job hitting /tick each minute
gcloud run deploy stadiumsense-simulator --source simulator --region us-central1
gcloud scheduler jobs create http sim-tick --schedule "* * * * *" \
  --uri "https://<cloud-run-url>/tick" --http-method GET
```

Gemini authenticates via **Vertex AI Express Mode** (an API key, not a service-account/ADC flow) — the key lives only in Secret Manager and is injected into the Cloud Functions runtime; it never appears in source, `.env` files, or the client. Gemini also has an offline **fake gateway** (`AI_BACKEND=fake`) used by tests and available as a demo fallback if Gemini is unreachable during judging.

## Security

See [SECURITY.md](SECURITY.md). No secrets are committed; `.env.local` and service-account keys are git-ignored.
