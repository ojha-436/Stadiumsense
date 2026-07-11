import { useTranslation } from "react-i18next";
import { Compass, Ticket, UtensilsCrossed, Activity } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Shared split-screen chrome for all auth screens: a branded, atmospheric
 *  panel on the left and the given form content on the right. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-extrabold tracking-tight lg:hidden">
            Stadium<span className="text-primary">Sense</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function BrandPanel() {
  const { t } = useTranslation();
  const points = [
    { icon: Compass, label: t("auth.panelPoint1") },
    { icon: UtensilsCrossed, label: t("auth.panelPoint2") },
    { icon: Activity, label: t("auth.panelPoint3") },
  ];
  return (
    <aside className="relative hidden overflow-hidden bg-[#080C14] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(120% 80% at 15% 0%, rgba(31,160,90,0.35), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(245,197,66,0.18), transparent 50%)",
        }}
      />
      <div aria-hidden="true" className="field-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
          <Ticket className="h-5 w-5 text-primary-400" aria-hidden="true" />
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight">
          Stadium<span className="text-primary-400">Sense</span>
        </span>
      </div>

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-flag-gold">
          {t("auth.panelBadge")}
        </span>
        <h2 className="mt-5 max-w-md font-display text-4xl font-black leading-[1.05] tracking-tight">
          {t("auth.panelHeadline")}
        </h2>
        <p className="mt-4 max-w-sm text-white/70">{t("auth.panelSub")}</p>
        <ul className="mt-8 flex flex-col gap-3">
          {points.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className="flex animate-fade-in items-center gap-3 text-sm text-white/85"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10">
                <Icon className="h-4 w-4 text-primary-400" aria-hidden="true" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-6 text-white/60">
        <Stat value="16" label="Stadiums" />
        <Stat value="48" label="Teams" />
        <Stat value="3" label="Nations" />
      </div>
    </aside>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-bold text-white">{value}</p>
      <p className="text-xs uppercase tracking-wider">{label}</p>
    </div>
  );
}
