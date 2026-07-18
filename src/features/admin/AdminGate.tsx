import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ADMIN_ACCESS_KEY, ADMIN_UNLOCK_KEY } from "./config";

/**
 * Gates the admin portal behind a digital access key (default "2026-Fifa",
 * overridable per deployment). Once entered, the portal stays unlocked for the
 * browser session. This models the "hardware/digital key" entry requirement.
 */
export function AdminGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "true"
  );
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim() === ADMIN_ACCESS_KEY) {
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgb(var(--accent-2) / 0.12), transparent 60%)",
        }}
      />
      <div className="field-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-surface-border bg-surface p-7 shadow-pop">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-2/15 text-accent-2">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          {t("adminGate.title")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("adminGate.sub")}</p>

        {error && (
          <Alert tone="error" className="mt-4">
            {t("adminGate.wrong")}
          </Alert>
        )}

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
          <Field label={t("adminGate.keyword")} hint={t("adminGate.hint")} required>
            {(props) => (
              <Input
                {...props}
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError(false);
                }}
                autoFocus
                placeholder="••••••••"
              />
            )}
          </Field>
          <Button type="submit" block size="lg">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {t("adminGate.enter")}
          </Button>
        </form>
      </div>
    </div>
  );
}
