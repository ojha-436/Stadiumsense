import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import type { Lang } from "@/types/domain";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useActiveMatch } from "@/lib/dataHooks";
import { OpsDashboard } from "./OpsDashboard";

export default function OpsApp() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as Lang) ?? "en";
  const { data: match, loading } = useActiveMatch();
  const nav: NavItem[] = [{ to: "/ops", label: t("nav.ops"), icon: Activity }];

  return (
    <AppShell nav={nav}>
      {loading ? (
        <Spinner label={t("common.loading")} className="py-10" />
      ) : match ? (
        <OpsDashboard match={match} lang={lang} />
      ) : (
        <Alert tone="warning">{t("common.error")}</Alert>
      )}
    </AppShell>
  );
}
