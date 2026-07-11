import { useTranslation } from "react-i18next";
import { Ticket } from "lucide-react";
import type { FanProfile, Lang } from "@/types/domain";
import { Card } from "@/components/ui/Card";
import { useMatch } from "../hooks";
import { ArrivalPlan } from "../components/ArrivalPlan";
import { RoutePlanner } from "../components/RoutePlanner";
import { seatLabel } from "../seat";

export function HomePage({ profile }: { profile: FanProfile }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as Lang) ?? "en";
  const { data: match } = useMatch(profile.matchId);

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-gradient-to-br from-surface-raised to-surface">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-flag-gold/15 p-2.5">
            <Ticket className="h-6 w-6 text-flag-gold" aria-hidden="true" />
          </div>
          <div>
            {match ? (
              <p className="font-bold">
                {match.home.teamName} v {match.away.teamName}
              </p>
            ) : (
              <p className="font-bold">{t("match.title")}</p>
            )}
            <p className="text-sm text-night-100">{seatLabel(profile.seat)}</p>
          </div>
        </div>
      </Card>

      <ArrivalPlan profile={profile} lang={lang} />
      <RoutePlanner profile={profile} lang={lang} />
    </div>
  );
}
