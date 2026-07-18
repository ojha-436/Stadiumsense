import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, DoorOpen, RefreshCw, Sparkles } from "lucide-react";
import type { FanProfile, Lang } from "@/types/domain";
import type { PlanArrivalResponse } from "@/types/contracts";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { logger } from "@/lib/logger";

/** Gemini arrival plan card: fetches on mount and on explicit refresh. */
export function ArrivalPlan({ profile, lang }: { profile: FanProfile; lang: Lang }): JSX.Element {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<PlanArrivalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await api.planArrival({
        matchId: profile.matchId,
        section: profile.seat.section,
        gate: profile.seat.gate,
        startArea: profile.startAddress,
        transportMode: profile.transportMode,
        accessibilityNeeds: profile.accessibilityNeeds,
        lang,
      });
      setPlan(result);
    } catch (err) {
      logger.error("Failed to generate arrival plan", err);
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
        <Sparkles className="h-5 w-5 text-flag-gold" aria-hidden="true" />
        <CardTitle>{t("plan.title")}</CardTitle>
        <Badge tone="warning" className="ml-auto">
          {t("plan.aiBadge")}
        </Badge>
      </CardHeader>

      {loading && <Spinner label={t("plan.generating")} className="py-4" />}

      {error && !loading && (
        <Alert tone="error">
          {t("common.error")}{" "}
          <button onClick={() => void load()} className="underline">
            {t("common.retry")}
          </button>
        </Alert>
      )}

      {plan && !loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={Clock}
              label={t("plan.leaveBy")}
              value={formatTime(Date.parse(plan.leaveByIso), lang)}
            />
            <Stat
              icon={Clock}
              label={t("plan.arriveBy")}
              value={formatTime(Date.parse(plan.arriveByIso), lang)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-pitch-500/10 p-3 text-pitch-400">
            <DoorOpen className="h-5 w-5" aria-hidden="true" />
            <span className="font-semibold">
              {t("plan.gate", { gate: plan.recommendedGate })}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-night-100">{t("plan.why")}</h4>
            <p className="mt-1 text-sm text-night-50/90">{plan.reasoning}</p>
          </div>

          {plan.assumptions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-night-100">{t("plan.assumptions")}</h4>
              <ul className="mt-1 list-inside list-disc text-sm text-night-50/80">
                {plan.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={() => void load()} className="self-start">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("plan.regenerate")}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-night-950 p-3">
      <div className="flex items-center gap-1.5 text-xs text-night-100">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
