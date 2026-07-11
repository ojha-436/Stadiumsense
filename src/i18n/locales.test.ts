import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

/** Recursively collect the dotted key paths of a nested translation object. */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k)
  );
}

describe("i18n locale parity", () => {
  const enKeys = keyPaths(en).sort();

  it("has a non-trivial set of English keys", () => {
    expect(enKeys.length).toBeGreaterThan(80);
  });

  it.each([
    ["es", es],
    ["fr", fr],
  ])("%s defines exactly the same keys as en (no missing/extra)", (_lang, locale) => {
    const keys = keyPaths(locale).sort();
    const missing = enKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !enKeys.includes(k));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });
});
