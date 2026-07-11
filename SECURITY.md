# Security Overview — StadiumSense

Security is a first-class design constraint, not an afterthought. This document
summarises the controls a reviewer can verify in the code.

## Identity & authorization

- **Firebase Auth** (email/password + Google) for identity.
- **Roles are Auth custom claims** (`role`, `stallId`, `active`) set **only** by the
  admin-only `provisionUser` Cloud Function. A client can never grant itself a
  role — the claim is server-issued and cryptographically signed in the token.
- Client-side route guards (`RequireRole`) are **UX only**. The authoritative
  boundary is Firestore/Storage security rules, tested in `test/rules/`.
- **Admin portal access key (`AdminGate`, default `2026-Fifa`, override via
  `VITE_ADMIN_KEY`) is a client-side gate, not a real access control** — it is
  compiled into the shipped JS bundle, so anyone inspecting it can read the
  value. It exists to keep the admin UI from being casually stumbled into, not
  to withstand a determined attacker. The real boundary behind it is unchanged:
  Firestore rules still require the `admin` custom claim for every admin
  action, so passing the gate alone grants no data access. For a non-demo
  deployment, move this check server-side (e.g. an App Check-gated callable
  that verifies a hashed key from Secret Manager) before relying on it.

## Data access rules (deny-by-default)

`firestore.rules` enforces, and `test/rules/firestore.test.ts` proves:

- A fan can read/write only their own `fanProfiles/{uid}` and `users/{uid}`, and
  cannot set their own `role`/`active`.
- A vendor can read/update only their own stall and only orders for that stall
  (`stallId` is pinned in their token) — never another vendor's data.
- Fans can file incident reports but cannot read others' reports; ops can.
- Poll votes are keyed by the voter's uid, so one-vote-per-user is structural;
  vote tallies are written only by a Cloud Function.
- Operational collections (`zones`, `gates`, `transitLines`, `opsBriefs`) are
  read-only to clients and written only by the server/simulator.

`storage.rules` restricts ticket and selfie uploads to the owner's path with
content-type and size caps.

## Secrets & third-party keys

- **No Gemini or Maps key ever reaches the browser.** All Gemini and Maps calls
  run inside Cloud Functions. Gemini authenticates via Vertex AI Express Mode
  using an API key (`@google/genai`, `vertexai: true`) bound from **Secret
  Manager** at deploy time via the `secrets` option — it is injected into the
  function's runtime environment and never appears in source, `.env` files, or
  the client bundle. Maps server keys live in Secret Manager the same way.
- The Firebase web API key is **not** a secret (access is governed by rules +
  App Check); it is the only key present client-side, by design.
- `.env*`, service-account JSON, and debug tokens are git-ignored.

## Platform hardening

- **App Check** (reCAPTCHA Enterprise) is enforced on every callable function,
  rejecting requests from clients other than the genuine app.
- **Content-Security-Policy** plus HSTS, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, and a locked-down
  `Permissions-Policy` are served on all responses (`firebase.json`).
- Temporary passwords for provisioned accounts use the Node **CSPRNG**.
- Deactivating an account revokes its refresh tokens, ending access promptly.
- All callable inputs are validated (type, length, ownership) before use.

## Reporting

This is a hackathon project. For real deployments, route disclosures to the
tournament security contact and rotate any exposed credentials immediately.
