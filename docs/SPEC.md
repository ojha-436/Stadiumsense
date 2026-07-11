# StadiumSense — Feature Spec / PRD
**FIFA World Cup 2026 Matchday Companion — Virtual PromptWar (Google × Hack2skill)**

Version 1.0 — 2026-07-10
Constraints source of truth: [HACKATHON.md](./HACKATHON.md)

---

## 1. Problem Statement

FIFA World Cup 2026 is the largest World Cup ever — 48 teams, 104 matches, 16 stadiums across the USA, Mexico, and Canada, with 80,000+ fans per match, most of them foreign visitors who don't know the stadium, the city's transit system, or (often) the local language. Today those fans arrive too early or too late, bunch up at the wrong gates, queue 30+ minutes for food and miss play, and can't find water or toilets — while stadium operators have no unified, real-time view of crowd pressure, incidents, or vendor status to act on. The cost of not solving it: degraded fan experience, dangerous gate congestion, lost vendor revenue, and reactive (instead of proactive) operations.

**Solution in one line:** StadiumSense is a multilingual GenAI matchday companion built on one shared Firebase data spine, with four role-based surfaces — Fan, Stadium Management, Vendor, and Admin — where Gemini turns raw ticket, location, and stadium data into personal guidance for fans and operational intelligence for staff.

## 2. Goals

1. **Fan gets a personalised matchday plan in < 60 seconds:** scan ticket (or answer a short questionnaire) → Gemini returns recommended departure time, transit route, arrival window, and entry gate.
2. **Order-to-seat works end-to-end:** fan places a food order → vendor sees it, updates status → fan sees live status at their seat, in their language.
3. **Ops sees and decides in real time:** management dashboard shows live (simulated) crowd density + fan-reported signals, and Gemini produces plain-language situation summaries and recommended actions.
4. **Score maximum on all six rubric parameters** — accessibility (WCAG 2.1 AA + EN/ES/FR), testing (unit + emulator + e2e), security (rules-per-role + App Check), code quality, efficiency, alignment.
5. **Demonstrably Google-native:** ≥ 8 Google Cloud/Firebase/AI services used with a clear purpose each.

## 3. Non-Goals (v1)

| Non-goal | Why out of scope |
|---|---|
| Real payment processing | Judges can't pay; mock checkout demonstrates the flow without PCI scope |
| Real FIFA ticketing API integration | No public API; QR/photo parse + questionnaire covers the UX |
| Native iOS/Android apps | PWA reaches judges instantly with zero install friction |
| Real CCTV/sensor crowd detection | No hardware; a clearly-labelled Cloud Run simulator feeds realistic data |
| Live official match data feeds (paid) | Seeded fixture/lineup data + Gemini narration is indistinguishable in demo |
| In-stadium AR navigation | High effort, low rubric return; static SVG stadium map with highlighted zones instead |
| Volunteer-specific surface | Folded into Management dashboard roles; separate surface is P2 |

## 4. Personas

- **Fan (Diego, 34, from Guadalajara, Spanish-speaking):** first time at this stadium, wants zero-stress arrival, food without missing goals, and fun with friends.
- **Stadium Ops Manager (Sarah, ops room):** needs one screen showing what's happening and what to do next.
- **Food Vendor (Hot Dog Stand #12):** needs to publish menu/stock and process incoming seat orders fast.
- **Tournament Admin:** provisions and revokes staff/vendor accounts, controls who sees what.

## 5. User Stories (by persona, priority order)

### Fan
- As a fan, I want to **scan my ticket QR/photo** so my match, seat, section, and gate are auto-filled without typing.
- As a fan without a scannable ticket, I want a **short interactive questionnaire** (match, seat block, arrival city/area, transport preference, accessibility needs) so I get the same personalised plan.
- As a fan, I want Gemini to tell me the **best time to leave and which gate to enter** based on my seat, expected crowd waves, and my start location, so I skip the worst queues.
- As a fan, I want to **enter my starting point** (home/hotel) and get the **best and least-crowded public transit route** to the stadium so I don't get stuck.
- As a fan, I want **interesting facts about today's match and both team lineups** so I feel informed and hyped.
- As a fan, I want to **browse food stalls** (menu, prices, distance from my seat, live queue/stock status) so I can choose where to buy.
- As a fan, I want to **order food/drinks delivered to my seat** and track order status live so I never miss play.
- As a fan, I want to **find nearest water refill points and toilets** with live availability status so basic needs are never a hunt.
- As a fan, I want to **post selfies and shout-outs for my favourite player** on the match social wall so I share the vibe.
- As a fan, I want to **vote in and create polls** (match winner, next goal scorer) so I engage with other fans.
- As a Spanish/French-speaking fan, I want the **entire app in my language** with one tap, so nothing is lost in translation.
- As a fan with low vision or motor impairment, I want **screen-reader-friendly, keyboard-navigable UI and voice interaction** so I can use every feature independently.
- **Edge cases:** invalid/duplicate ticket scan → clear error + questionnaire fallback; stall out of stock mid-order → item blocked with explanation; offline in concourse → cached plan + queued actions.

### Stadium Ops Manager
- As an ops manager, I want a **live dashboard** of zone-level crowd density, gate throughput, and fan-reported incidents so I see pressure building before it's dangerous.
- As an ops manager, I want **Gemini situation briefs** ("North concourse trending to critical in ~20 min; open Gate E, redirect Section 114–118") so decisions are fast and defensible.
- As an ops manager, I want amenity status control (toilet block closed, water station down) so fan-facing info stays truthful.

### Vendor
- As a vendor, I want to **manage my stall profile, menu, prices, and stock levels** so fans see accurate availability.
- As a vendor, I want an **order queue** (new → accepted → preparing → out for delivery → delivered) with sound/visual alerts so no order is missed.
- As a vendor, I want stock to **auto-decrement on order** and let me mark items sold out in one tap.

### Admin
- As an admin, I want to **invite/provision stadium staff and vendor accounts with role-scoped access** so each user sees only their surface.
- As an admin, I want to **deactivate a vendor or staff account instantly** so access control is real, not cosmetic.
- As an admin, I want to see basic **platform stats** (active fans, orders, incidents) for the demo story.

## 6. Requirements

### P0 — Must-Have (feature cannot ship without)

**F1. Ticket onboarding (scan + questionnaire)**
- Scan path: camera/photo upload → Gemini Vision extracts match, date, seat, section, gate → user confirms parsed fields.
- Questionnaire path: ≤ 6 conversational steps (match, seat/section, start location, transport mode, party size, accessibility needs).
- AC: Given a sample ticket image, when scanned, then match/seat/section auto-fill with a confirm screen; given a blurry/invalid image, then a clear error offers the questionnaire path. Both paths produce an identical `fanProfile` document.

**F2. Gemini arrival planner (time + gate)**
- Input: fanProfile + fixture kickoff + simulated crowd forecast. Output: recommended leave-by time, arrival window, assigned/suggested gate, plus reasoning in plain language, in the fan's language.
- AC: Plan renders < 5 s (streaming); changes when seat/start location changes; states its assumptions ("based on expected gate congestion 60–90 min before kickoff").

**F3. Route planner (home → stadium, less-crowded transit)**
- Input: start location (place autocomplete). Uses Google Maps Platform (Routes/Directions + Places) for candidate transit routes; Gemini ranks them against simulated transit-load data and explains the trade-off ("Route B is 12 min longer but avoids the packed Line 3").
- AC: ≥ 2 route options with crowd labels; works for the demo stadium's metro area; graceful fallback to plain directions if crowd data unavailable.

**F4. Match hub (facts + lineups)**
- Seeded fixture data (teams, lineups, kickoff) in Firestore; Gemini generates match preview, fun facts, head-to-head trivia — cached per match per language, not regenerated per user.
- AC: Facts load < 2 s from cache; lineups show 11+subs per team; content available in EN/ES/FR.

**F5. Food stalls + order-to-seat**
- Stall directory: name, zone, distance from fan's section, menu with prices, live stock, open/closed.
- Order flow: cart → seat auto-attached from ticket → mock payment → live status tracking (Firestore listener).
- AC: Order placed by fan appears on vendor queue < 2 s; every status change reflects on fan screen < 2 s; out-of-stock items cannot be added to cart.

**F6. Amenities finder (water, toilets)**
- Stadium map (SVG zones) + list view: nearest water refill and toilets relative to fan's section, with status (available / busy / closed) controlled by ops.
- AC: Sorted by proximity to fan's section; status changes by ops propagate live.

**F7. Stadium management dashboard**
- Zone heat view fed by the crowd simulator, gate throughput, incident list (from fan reports + simulator), amenity status controls.
- **Gemini ops brief:** on-demand and periodic summary with recommended actions.
- AC: Simulator events visible < 3 s; Gemini brief references actual current data (zones/numbers), not generic text.

**F8. Admin portal (access provisioning)**
- Create/invite staff & vendor accounts, assign role (`admin` / `ops` / `vendor` / `fan` default), activate/deactivate; role changes enforced by security rules + custom claims.
- AC: Deactivated vendor loses portal access on next token refresh (≤ 1 min); a vendor can never read another vendor's orders; verified by emulator rule tests.

**F9. Vendor portal**
- Stall profile + menu CRUD, stock management, live order queue with status transitions.
- AC: Stock decrement on order; sold-out toggle reflects on fan side < 2 s.

**F10. Multilingual EN/ES/FR**
- Full UI i18n (static strings) + Gemini-generated content produced/cached per language; language picker persisted per user.
- AC: No hard-coded English strings in any P0 screen; Gemini content (facts, plans, briefs) delivered in the selected language.

**F11. Accessibility (WCAG 2.1 AA)**
- Semantic HTML, aria labels, focus management, ≥ 4.5:1 contrast, keyboard-complete flows, reduced-motion support; alt text on all social images (Gemini-generated captions).
- AC: Lighthouse a11y score ≥ 95 on fan PWA core screens; axe automated checks pass in CI.

**F12. Security baseline**
- Firebase Auth (email + Google sign-in), custom claims for roles, Firestore security rules per collection per role, App Check, all Gemini/Maps calls server-side (Cloud Functions/Cloud Run) with keys in Secret Manager.
- AC: Emulator rule tests prove: fan can't write stalls, vendor can't read other vendors' orders, only admin writes roles; no API key present in client bundle.

### P1 — Nice-to-Have (build after P0 is demo-ready)

**F13. Social wall** — selfie posts (Firebase Storage), player shout-outs, moderation via Gemini safety check before publish; per-match feed.
**F14. Prediction polls** — create/vote on match-winner and goal-scorer polls; live result bars; one vote per user per poll (enforced by rules).
**F15. Voice interaction** — mic input + TTS output for the fan concierge (Cloud Speech-to-Text / Text-to-Speech), flagship accessibility demo moment.
**F16. Fan concierge chat** — free-form multilingual Q&A ("where's my gate?") grounded on stadium/fixture data via Gemini function calling.
**F17. Admin analytics** — orders/incidents/active-users charts (could be BigQuery-backed for the "post-match analytics" story).

### P2 — Future Considerations (design for, don't build)

- Real ticketing/payment integration; multi-stadium tenancy (data model already keys by `stadiumId`/`matchId`); volunteer surface; push notifications (FCM) for order status & gate changes; sustainability tracking (waste/energy per match); AR wayfinding.

## 7. Success Metrics

**Hackathon (primary):**
- Rubric: target top-band scores on all six parameters; Lighthouse a11y ≥ 95; test coverage ≥ 70% on functions + rules fully tested; zero client-side secrets.
- Demo: full golden-path demo (scan → plan → route → order → vendor fulfils → ops brief → admin revoke) in under 4 minutes without a failure.

**Product (framing for judges):**
- Leading: % fans completing onboarding < 60 s; order-to-acceptance median < 30 s; plan regeneration rate (indicates trust).
- Lagging: gate congestion spread (peak vs. mean arrivals), food revenue per attendee, incident response time.

## 8. Open Questions

- **[Organiser/User — blocking]** Exact submission deadline and deliverable list (video? PPT?) → fill in HACKATHON.md.
- **[Organiser/User — blocking]** Official rubric weights for the six parameters → fill in HACKATHON.md.
- **[User — non-blocking]** Which demo stadium/city to feature (affects transit demo; recommend MetLife Stadium, NJ — the final's venue — or Estadio Azteca for the ES story).
- **[Engineering — non-blocking]** Gemini model split: Flash for chat/translation vs. Pro for ops briefs — decide after latency testing.
- **[User — non-blocking]** GCP billing/quota confirmed for Vertex AI + Maps Platform during judging window?

## 9. Timeline & Phasing

- **Phase 1 — Spine + Fan core (P0 F1–F6, F10–F12):** scaffold, auth/roles, data model, simulator, ticket onboarding, planner, routes, match hub, stalls/ordering, amenities.
- **Phase 2 — Ops/Vendor/Admin (P0 F7–F9):** dashboards and portals on the same data.
- **Phase 3 — Delight (P1 F13–F16):** social wall, polls, voice, concierge chat.
- **Phase 4 — Hardening:** tests to target, a11y audit, security rule tests, README/architecture polish, demo script, deploy freeze.

Rule: **Phase 1 + 2 must be deployed and demoable before any Phase 3 work starts.** If time collapses, the golden path is the submission.
