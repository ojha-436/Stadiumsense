import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import type { FanProfile, Lang, TeamLineup } from "@/types/domain";
import type { GetMatchContentResponse } from "@/types/contracts";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useMatch } from "../hooks";

export function MatchPage({ profile }: { profile: FanProfile }): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as Lang) ?? "en";
  const { data: match, loading } = useMatch(profile.matchId);
  const [content, setContent] = useState<GetMatchContentResponse | null>(null);
  const [factsError, setFactsError] = useState(false);

  useEffect(() => {
    let active = true;
    setContent(null);
    setFactsError(false);
    api
      .getMatchContent({ matchId: profile.matchId, lang })
      .then((c) => active && setContent(c))
      .catch(() => active && setFactsError(true));
    return () => {
      active = false;
    };
  }, [profile.matchId, lang]);

  if (loading) return <Spinner label={t("common.loading")} className="py-10" />;
  if (!match) return <Alert tone="error">{t("common.error")}</Alert>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm text-night-100">{match.stage}</p>
        <h1 className="text-2xl font-extrabold">
          {match.home.teamName} <span className="text-night-100">v</span> {match.away.teamName}
        </h1>
        <p className="mt-1 text-sm text-night-100">
          {match.venueName}, {match.city} · {t("match.kickoff")} {formatTime(match.kickoff, lang)}
        </p>
      </Card>

      <Card>
        <CardHeader>
          <Sparkles className="h-5 w-5 text-flag-gold" aria-hidden="true" />
          <CardTitle>{t("match.facts")}</CardTitle>
        </CardHeader>
        {factsError && <Alert tone="warning">{t("common.error")}</Alert>}
        {!content && !factsError && <Spinner label={t("match.loadingFacts")} className="py-3" />}
        {content && (
          <>
            <p className="text-night-50/90">{content.preview}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {content.facts.map((fact, i) => (
                <li key={i} className="flex gap-2 text-sm text-night-50/90">
                  <span aria-hidden="true" className="text-flag-gold">
                    ⚽
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Lineup team={match.home} />
        <Lineup team={match.away} />
      </div>
    </div>
  );
}

function Lineup({ team }: { team: TeamLineup }) {
  const { t } = useTranslation();
  const starters = team.players.filter((p) => p.isStarter);
  const subs = team.players.filter((p) => !p.isStarter);
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <CardTitle>{team.teamName}</CardTitle>
        <Badge tone="info">
          {t("match.formation")} {team.formation}
        </Badge>
      </div>
      <PlayerList label={t("match.starters")} players={starters} />
      {subs.length > 0 && (
        <div className="mt-3">
          <PlayerList label={t("match.subs")} players={subs} muted />
        </div>
      )}
    </Card>
  );
}

function PlayerList({
  label,
  players,
  muted,
}: {
  label: string;
  players: TeamLineup["players"];
  muted?: boolean;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-night-100">{label}</h4>
      <ul className={"mt-1 flex flex-col gap-1 text-sm " + (muted ? "text-night-100" : "")}>
        {players.map((p) => (
          <li key={p.number} className="flex items-center gap-2">
            <span className="w-6 text-right font-mono text-night-100">{p.number}</span>
            <span>{p.name}</span>
            <Badge tone="neutral" className="ml-auto">
              {p.position}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
