# Hackathon Context — Virtual PromptWar (Google × Hack2skill)

> Single source of truth for this project. Claude: treat everything here as hard constraints.
> Fill this in ONCE at kickoff so the problem statement never needs re-pasting.

## Event
- **Hackathon:** Virtual PromptWar — organised by Google and Hack2skill
- **Track / theme:** GenAI for FIFA World Cup 2026 stadium operations & tournament experience
- **Submission deadline:** `<TODO: paste date + timezone>`
- **Deliverables:** Fully functional solution deployed on Google Cloud + Firebase; `<TODO: confirm — repo link, demo video, PPT?>`

## Problem statement (verbatim from organiser)
Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff. The solution must leverage Generative AI to improve navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support during the FIFA World Cup 2026.

## Required / recommended tech stack (from organiser)
- Google Cloud (use as many Google Cloud tools as reasonably possible)
- Google Firebase (Hosting, Auth, Firestore, Cloud Functions)
- Google Gemini integration (mandatory GenAI layer)
- `<TODO: paste any additional stack requirements from the organiser brief>`

## Judging rubric
| Criterion | Weight | Notes on how to score max |
|---|---|---|
| Code quality | `<TODO>` | TypeScript strict mode, ESLint + Prettier, small typed modules, meaningful commits |
| Testing | `<TODO>` | Vitest unit tests + Firebase emulator integration tests + Playwright e2e smoke |
| Security | `<TODO>` | Firestore security rules per role, App Check, Secret Manager, no keys in client |
| Accessibility | `<TODO>` | WCAG 2.1 AA, aria labels, keyboard nav, voice I/O, EN/ES/FR localisation |
| Problem statement alignment | `<TODO>` | Cover navigation, crowd, accessibility, transport, multilingual, ops intelligence, decision support |
| Efficiency | `<TODO>` | Gemini Flash where possible, response caching, Firestore realtime listeners not polling |

## Our solution (one paragraph)
**StadiumSense** — a FIFA World Cup 2026 matchday companion on one shared Firebase data spine with four role-based surfaces: (1) a multilingual (EN/ES/FR) fan PWA — scan or enter your ticket and Gemini recommends the best arrival time, gate, and least-crowded public transit route from your start location; browse match facts and lineups; find water/toilets; order food from stall vendors delivered to your seat; and post selfies, shout-outs, and match-prediction polls on a social wall; (2) a stadium-management dashboard with live crowd/incident intelligence and Gemini decision support; (3) a vendor portal for stock and order management; (4) an admin portal that provisions staff/vendor access. Built on Firebase + Cloud Run + Vertex AI Gemini + Google Maps Platform.

## Live links
- **Deployed app:** `<TODO after deploy>`
- **Repo:** `<TODO>`
- **Demo video:** `<TODO>`

## Scope decisions log
- 2026-07-10 — Chose combined fan + ops + vendor + admin platform on one Firestore event spine (see docs/SPEC.md) — deepest rubric coverage per hour of build time.
- 2026-07-10 — Languages fixed to EN / ES / FR (host nations USA, Mexico, Canada).
- 2026-07-10 — Payments mocked (no real gateway); ticket parsing via QR/photo + Gemini Vision with manual questionnaire fallback — no real FIFA ticketing API exists for public use.
- 2026-07-10 — Crowd data comes from a Cloud Run simulator, clearly labelled in demo — no real stadium sensors available.
