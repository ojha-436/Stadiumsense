import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { DEMO } from "@/lib/demo/flag";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/features/auth/useAuth";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Shared application chrome: skip link, header with primary navigation, and a
 * single <main> landmark. Navigation is a real <nav> with an accessible label
 * and current-page indication so screen readers and keyboard users orient fast.
 */
export function AppShell({ nav, children }: { nav: NavItem[]; children: React.ReactNode }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-dvh">
      <a href="#main" className="skip-link">
        {t("app.skipToContent")}
      </a>

      <header className="sticky top-0 z-40 border-b border-surface-border bg-night-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-extrabold text-flag-gold">{t("app.name")}</span>
          <div className="flex items-center gap-2">
            {DEMO && <DemoRoleSwitcher />}
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("nav.signOut")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-28 pt-4">
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Bottom tab bar (mobile-first). Uses NavLink aria-current for the
          active tab so assistive tech announces the current section. */}
      <nav
        aria-label={t("app.name")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-night-950/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-5xl items-stretch justify-around">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                    isActive ? "text-flag-gold" : "text-night-100 hover:text-night-50"
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden={true} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
