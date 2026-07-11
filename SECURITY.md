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

- **No Gemini or Maps key ever reaches the browser.** All Gemini (Vertex AI) and
  Maps calls run inside Cloud Functions; Vertex AI authenticates via the
  function's service account (Application Default Credentials) — there is no API
  key to leak. Maps server keys live in Secret Manager.
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
