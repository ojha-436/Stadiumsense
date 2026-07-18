import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigation, Route as RouteIcon } from "lucide-react";
import type { FanProfile, Lang } from "@/types/domain";
import type { PlanRouteResponse, RouteOption } from "@/types/contracts";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { logger } from "@/lib/logger";

const CROWD_TONE = { low: "success", medium: "warning", high: "danger" } as const;

/** Home→stadium route planner. Only renders once the fan has a start address. */
export function RoutePlanner({ profile, lang }: { profile: FanProfile; lang: Lang }): JSX.Element {
  const { t } = useTranslation();
  const [data, setData] = useState<PlanRouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!profile.startAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      setData(
        await api.planRoute({
          matchId: profile.matchId,
          startAddress: profile.startAddress,
          transportMode: profile.transportMode,
          lang,
        })
      );
    } catch (err) {
      logger.error("Failed to plan route", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [profile, lang]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <Navigation className="h-5 w-5 text-flag-blue" aria-hidden="true" />
        <CardTitle>{t("route.title")}</CardTitle>
      </CardHeader>

      {!profile.startAddress && <Alert tone="info">{t("route.noStart")}</Alert>}
      {loading && profile.startAddress && <Spinner label={t("route.planning")} className="py-4" />}
      {error && <Alert tone="error">{t("common.error")}</Alert>}

      {data && !loading && (
        <ul className="flex flex-col gap-3">
          {data.options.map((opt) => (
            <RouteCard
              key={opt.id}
              option={opt}
              recommended={opt.id === data.bestOptionId}
              lang={lang}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function RouteCard({
  option,
  recommended,
}: {
  option: RouteOption;
  recommended: boolean;
  lang: Lang;
}) {
  const { t } = useTranslation();
  return (
    <li className="rounded-xl border border-surface-border bg-night-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold">
          <RouteIcon className="h-4 w-4 text-night-100" aria-hidden="true" />
          {t("route.duration", { mins: option.durationMins })}
        </span>
        <div className="flex items-center gap-2">
          {recommended && <Badge tone="success">{t("route.recommended")}</Badge>}
          <Badge tone={CROWD_TONE[option.crowdLevel]}>
            {t("route.crowd")}: {t(`route.crowd${cap(option.crowdLevel)}`)}
          </Badge>
        </div>
      </div>
      <p className="mt-2 text-sm text-night-50/90">{option.summary}</p>
      <p className="mt-1 text-sm text-flag-gold">{option.recommendation}</p>
      <ol className="mt-2 list-inside list-decimal text-xs text-night-100">
        {option.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </li>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
