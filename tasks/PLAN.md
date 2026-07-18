# gemma-coder task plan — judging score improvements

Goal: raise Code Quality, Problem Statement Alignment, Testing, and Security scores
per docs/JUDGING_SCORE_PLAN.md. Local model (gemma4:latest) writes all application
source files listed below; tests already exist for each and were written before any
task spec (independent verification baseline).

## Task order (dependencies first)

1. `01-frontend-logger.md` -> `src/lib/logger.ts` (no deps)
2. `02-functions-logger.md` -> `functions/src/lib/logger.ts` (no deps)
3. `03-order-pricing.md` -> `functions/src/lib/orderPricing.ts` (no deps)
4. `04-sustainability-calc.md` -> `src/features/fan/sustainability.ts` (no deps)
5. `05-sustainability-component.md` -> `src/features/fan/components/SustainabilityInsight.tsx` (deps: 04, i18n keys already added)
6. `06-console-replacements.md` -> 7 small edits swapping console.error for the logger (deps: 01) — done as direct Edit calls, not full-file generation, since these are one-line swaps in otherwise-unchanged files
7. Manual (by agent, not local model): wire `SustainabilityInsight` into `HomePage.tsx`, wire `computeOrderTotal` into `onOrderCreated.ts` — these are single-call-site integrations into existing files with surrounding logic the local model hasn't seen; safer done directly with Edit + review than regenerating the whole file
8. Manual: add `@typescript-eslint/explicit-module-boundary-types` (warn) to `eslint.config.js`

## Files NOT delegated (and why)

- i18n JSON locale keys — translation quality risk, already added directly.
- `eslint.config.js` — single-line config change, no test to gate it, safer direct.
- Integration edits into `onOrderCreated.ts` / `HomePage.tsx` — small, surgical
  insertions into files with logic the local model has no context window budget to
  safely reproduce in full; risk of it silently dropping unrelated existing code.
