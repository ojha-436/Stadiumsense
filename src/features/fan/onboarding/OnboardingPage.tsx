import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScanLine, ClipboardList } from "lucide-react";
import type { Lang } from "@/types/domain";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logger } from "@/lib/logger";
import { useMatches } from "../hooks";
import { Questionnaire } from "./Questionnaire";
import { TicketScan } from "./TicketScan";
import { saveFanProfile, type ProfileDraft } from "./saveProfile";

type Tab = "scan" | "form";

/** First-run experience: choose to scan a ticket or fill the questionnaire.
 *  Both paths converge on the same saved profile. */
export function OnboardingPage({ uid }: { uid: string }): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as Lang) ?? "en";
  const { data: matches, loading } = useMatches();
  const [tab, setTab] = useState<Tab>("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (draft: ProfileDraft) => {
    setSaving(true);
    setError(false);
    try {
      await saveFanProfile(uid, draft);
      // The FanApp profile listener re-renders into the tabbed app automatically.
    } catch (err) {
      logger.error("Failed to save fan profile", err);
      setError(true);
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-2xl font-extrabold text-flag-gold">{t("app.name")}</p>
          <p className="text-sm text-night-100">{t("app.tagline")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <Card>
        <h1 className="text-xl font-bold">{t("onboarding.title")}</h1>

        <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label={t("onboarding.title")}>
          <TabButton active={tab === "scan"} onClick={() => setTab("scan")} icon={ScanLine}>
            {t("onboarding.scanTab")}
          </TabButton>
          <TabButton active={tab === "form"} onClick={() => setTab("form")} icon={ClipboardList}>
            {t("onboarding.questionnaireTab")}
          </TabButton>
        </div>

        <div className="mt-5">
          {error && (
            <Alert tone="error" className="mb-4">
              {t("common.error")}
            </Alert>
          )}
          {loading ? (
            <Spinner label={t("common.loading")} className="justify-center py-8" />
          ) : tab === "scan" ? (
            <TicketScan uid={uid} matches={matches} submitting={saving} onSubmit={submit} />
          ) : (
            <Questionnaire matches={matches} lang={lang} submitting={saving} onSubmit={submit} />
          )}
        </div>
      </Card>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ScanLine;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors " +
        (active
          ? "border-flag-gold bg-flag-gold/10 text-flag-gold"
          : "border-surface-border text-night-100 hover:border-night-100")
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
