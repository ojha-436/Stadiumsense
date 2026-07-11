import type { Lang } from "@/types/domain";

const LOCALE: Record<Lang, string> = { en: "en-US", es: "es-MX", fr: "fr-CA" };

/** Format a cents amount as currency in the fan's locale (USD across hosts). */
export function formatMoney(cents: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Format an epoch-ms time as a short local time, e.g. "5:40 PM". */
export function formatTime(epochMs: number, lang: Lang = "en"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(epochMs));
}

/** Human "in 25 min" / "12 min ago" relative label. */
export function formatRelative(epochMs: number, now: number, lang: Lang = "en"): string {
  const diffMin = Math.round((epochMs - now) / 60000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: "auto" });
  if (Math.abs(diffMin) >= 60) return rtf.format(Math.round(diffMin / 60), "hour");
  return rtf.format(diffMin, "minute");
}
