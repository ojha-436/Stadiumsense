# Task: functions/src/lib/logger.ts

Target language: TypeScript, strict mode, targeting Node.js 20 (Firebase Cloud
Functions v2 runtime), compiled with `"module": "NodeNext"` — all relative imports
in this codebase use explicit `.js` extensions (even though the source is `.ts`).
This file has no relative imports itself, so that only matters if you add any.

## Purpose

A minimal structured logger for Cloud Functions that emits JSON lines matching the
Google Cloud Logging structured-log convention (a `severity` field of `"INFO"` /
`"WARNING"` / `"ERROR"` plus a `message` field are auto-parsed by Cloud Logging).
This replaces ad-hoc `console.log`/`console.error` calls so Cloud Logging can filter
and alert by severity.

## Public API

Write this as ONE fully-initialized `const` object literal — do NOT write a
type-annotated `const` declaration first and assign/export a second `const` of the
same name later (that produces "const must be initialized" and "duplicate
declaration" compile errors). Example of a valid shape (you may restyle internals,
but keep one single `export const logger = {...}` with no separate type-only
declaration reusing the name `logger`):

```ts
export interface LogContext {
  [key: string]: unknown;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    /* build + console.log JSON payload */
  },
  warn(message: string, context?: LogContext): void {
    /* build + console.log JSON payload */
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    /* build + console.log JSON payload */
  },
};
```

## Behavior requirements

- Every method calls `console.log(jsonString)` exactly once — a single string
  argument, never multiple arguments, never `console.error`/`console.warn` directly
  (Cloud Functions captures everything written to stdout; using `console.log`
  uniformly and relying on the `severity` field is the correct pattern here).
- `jsonString` must be valid JSON (parseable with `JSON.parse`) with at least:
  - `severity`: `"INFO"` for `info()`, `"WARNING"` for `warn()`, `"ERROR"` for `error()`
  - `message`: the exact string passed in
  - any additional keys from `context`, spread at the top level of the JSON object
    (e.g. `logger.info("x", { matchId: "demo-final" })` produces JSON containing
    `"matchId":"demo-final"` alongside `severity`/`message`)
- `error(message, error?, context?)`:
  - When `error` is an `Error` instance, include an `error` field in the JSON
    payload whose string value contains `error.message` (e.g. `error.message` or
    `error.stack`) — test asserts `payload.error` contains the substring `"boom"`
    for `new Error("boom")`.
  - When no `error` argument is passed (or it's not an Error), still emit exactly
    one JSON payload with `severity: "ERROR"` and the correct `message` — do not
    throw and do not skip logging.
- No dependencies beyond the TypeScript/Node standard library — do not import
  `firebase-functions/logger` or any other package.

## Edge cases

- `context` keys must never overwrite `severity` or `message` if a caller passes a
  context object containing those keys (severity/message from the method call
  always win) — defensive but not separately tested, use your judgement.
- Do not add any other exported symbols besides `logger` and `LogContext`.

## Strict lint requirements (this project's ESLint fails the build on these)

- NEVER use the `any` type, in any form — not `Record<string, any>`, not
  `any[]`, not a bare `any` annotation. For the JSON payload object being built up,
  type it as `Record<string, unknown>` instead (this is fully compatible with
  `JSON.stringify` and with spreading a `LogContext`).
- Every `let`-declared variable that is never reassigned after its initializer
  must be `const` instead (the `prefer-const` rule is an error, not a warning).
  Prefer building the payload with a single object literal / spread instead of
  mutating a `let` binding, e.g.:
  ```ts
  const payload: Record<string, unknown> = {
    severity: "ERROR",
    message,
    ...context,
    ...(error instanceof Error ? { error: error.stack ?? error.message } : {}),
  };
  ```
- Never declare a `catch (e)` (or any catch binding) that you don't use — either
  reference the bound variable, or omit the binding entirely with `catch { ... }`
  (valid in this project's target ES version). An unused catch binding is a lint
  error here (`@typescript-eslint/no-unused-vars`), not a warning.
