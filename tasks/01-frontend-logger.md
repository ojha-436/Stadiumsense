# Task: src/lib/logger.ts

Target language: TypeScript, strict mode, ES2020+, no `any`. This file runs in a
Vite + React browser bundle (not Node) — do not import Node built-ins.

## Purpose

A tiny structured logging wrapper for the frontend so call sites stop using raw
`console.error(...)` directly. Centralizing this makes future upgrades (e.g. sending
errors to a monitoring service) a one-file change instead of a grep-and-replace
across the codebase.

## Public API

Write this as a plain object literal assigned directly to a `const`, fully
initialized in one statement — do NOT write a type-annotated `const` declaration
followed by property assignments later (that produces "const must be initialized"
and duplicate-declaration compile errors). This exact shape compiles correctly:

```ts
export interface LogContext {
  [key: string]: unknown;
}

function debug(message: string, context?: LogContext): void {
  console.debug(message, context ?? "");
}

function info(message: string, context?: LogContext): void {
  console.info(message, context ?? "");
}

function warn(message: string, context?: LogContext): void {
  console.warn(message, context ?? "");
}

function error(message: string, err?: unknown, context?: LogContext): void {
  console.error(message, err, context ?? "");
}

export const logger = { debug, info, warn, error };
```

The template above is a fully valid, compilable, spec-compliant implementation.
You may restyle it (different internal variable names, combined into one object
literal instead of separate functions, etc.) but the CALL SHAPE to `console.*`
must stay EXACTLY as shown: always exactly 2 or 3 arguments, always passing
`context ?? ""` as the last argument (never omitted, never conditionally added).
`error()` always passes exactly 3 arguments to `console.error`: message, `err`
(even when `err` is `undefined`), then `context ?? ""`.

## Behavior requirements

- Every method's first console argument MUST be a string that contains the exact
  `message` text passed in (e.g. prefixed with a tag/timestamp is fine, but the
  literal message substring must appear somewhere in it) — tests assert with
  `expect.stringContaining(message)`.
- When `context` is provided (a plain object), pass that exact object through
  unchanged as the trailing argument (do not JSON.stringify it) — tests assert
  `toHaveBeenCalledWith(expect.stringContaining(msg), context)` for `info`.
- No exceptions thrown for any input, including missing `context`/`error`.
- No dependencies beyond the TypeScript standard library — pure console wrapper,
  no external logging package.

## Edge cases

- `error()` must still produce exactly one `console.error` call, with exactly 3
  arguments (message, `undefined`, `""`), when no `error` argument is passed at all.
- Do not add any other exported symbols besides `logger` and the `LogContext` type.

## Example usage (for your own reference, not part of the file)

```ts
logger.info("order placed", { orderId: "o1" });
logger.error("Failed to save fan profile", err);
```
