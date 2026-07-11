import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, AlertTriangle, DoorClosed, Sparkles, TrainFront } from "lucide-react";
import type { Lang, Match, Zone } from "@/types/domain";
import type { OpsBriefResponse } from "@/types/contracts";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { SimulatedBadge } from "@/components/SimulatedBadge";
import { useAmenities } from "@/features/fan/hooks";
import { useGates, useIncidents, useTransitLines, useZones } from "./hooks";
import { setAmenityStatus, setIncidentStatus } from "./actions";
import { OpsChat } from "./OpsChat";

const SEV_TONE = { low: "info", medium: "warning", high: "danger" } as const;

export function OpsDashboard({ match, lang }: { match: Match; lang: Lang }) {
  const { t } = useTranslation();
  const { data: zones } = useZones(match.id);
  const { data: gates } = useGates(match.id);
  const { data: transit } = useTransitLines(match.id);
  const { data: incidents } = useIncidents(match.id);
  const { data: amenities } = useAmenities(match.id);

  const [brief, setBrief] = useState<OpsBriefResponse | null>(null);
  const [briefing, setBriefing] = useState(false);
  const [briefError, setBriefError] = useState(false);

  const generateBrief = async () => {
    setBriefing(true);
    setBriefError(false);
    try {
      setBrief(await api.opsBrief({ matchId: match.id, lang }));
    } catch {
      setBriefError(true);
    } finally {
      setBriefing(false);
    }
  };

  const openIncidents = incidents.filter((i) => i.status !== "resolved");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("ops.title")}</h1>
          <p className="text-sm text-night-100">
            {match.home.teamName} v {match.away.teamName} · {match.venueName}
          </p>
        </div>
        <SimulatedBadge />
      </div>

      {/* Fan-data-grounded assistant */}
      <OpsChat matchId={match.id} lang={lang} />

      {/* Gemini situation brief */}
      <Card className="border-flag-gold/40">
        <CardHeader>
          <Sparkles className="h-5 w-5 text-flag-gold" aria-hidden="true" />
          <CardTitle>{t("ops.brief")}</CardTitle>
          <Button
            size="sm"
            className="ml-auto"
            loading={briefing}
            onClick={() => void generateBrief()}
          >
            {t("ops.generateBrief")}
          </Button>
        </CardHeader>
        {briefing && <Spinner label={t("ops.generating")} className="py-2" />}
        {briefError && <Alert tone="error">{t("common.error")}</Alert>}
        {brief && !briefing && (
          <div className="flex flex-col gap-3">
            <p className="text-night-50/90">{brief.summary}</p>
            {brief.actions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-night-100">
                  {t("ops.recommendedActions")}
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {brief.actions.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-surface-border bg-night-950 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{a.title}</span>
                        <Badge tone={SEV_TONE[a.priority]}>{a.priority}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-night-50/80">{a.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Crowd density */}
      <Card>
        <CardHeader>
          <Activity className="h-5 w-5 text-flag-blue" aria-hidden="true" />
          <CardTitle>{t("ops.crowd")}</CardTitle>
        </CardHeader>
        <ul className="flex flex-col gap-3">
          {zones.map((z) => (
            <ZoneBar key={z.id} zone={z} capacityLabel={t("ops.capacity")} />
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gates */}
        <Card>
          <CardHeader>
            <DoorClosed className="h-5 w-5 text-night-100" aria-hidden="true" />
            <CardTitle>{t("ops.gates")}</CardTitle>
          </CardHeader>
          <ul className="flex flex-col gap-2">
            {gates.map((g) => (
              <li key={g.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{g.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-night-100">{t("ops.queue", { mins: g.queueMins })}</span>
                  <Badge tone={g.status === "open" ? "success" : "danger"}>{g.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Transit */}
        <Card>
          <CardHeader>
            <TrainFront className="h-5 w-5 text-night-100" aria-hidden="true" />
            <CardTitle>{t("ops.transit")}</CardTitle>
          </CardHeader>
          <ul className="flex flex-col gap-2">
            {transit.map((line) => (
              <li key={line.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{line.name}</span>
                  <span className="text-night-100">{Math.round(line.loadPct)}%</span>
                </div>
                <Meter value={line.loadPct} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <AlertTriangle className="h-5 w-5 text-flag-gold" aria-hidden="true" />
          <CardTitle>{t("ops.incidents")}</CardTitle>
          <Badge tone={openIncidents.length ? "warning" : "success"} className="ml-auto">
            {openIncidents.length}
          </Badge>
        </CardHeader>
        <ul className="flex flex-col gap-2">
          {incidents.map((inc) => (
            <li
              key={inc.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-surface-border bg-night-950 p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={SEV_TONE[inc.severity]}>{inc.severity}</Badge>
                  <span className="font-medium">{inc.type}</span>
                  <span className="text-xs text-night-100">· {inc.zone}</span>
                </div>
                <p className="mt-1 text-sm text-night-50/80">{inc.description}</p>
              </div>
              {inc.status !== "resolved" && (
                <div className="flex flex-shrink-0 flex-col gap-1">
                  {inc.status === "open" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void setIncidentStatus(inc.id, "acknowledged")}
                    >
                      {t("ops.acknowledge")}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => void setIncidentStatus(inc.id, "resolved")}>
                    {t("ops.resolve")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* Amenity control */}
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.amenities")}</CardTitle>
        </CardHeader>
        <ul className="flex flex-col gap-2">
          {amenities.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <span>
                {a.label} <span className="text-night-100">· {a.zone}</span>
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    a.status === "available" ? "success" : a.status === "busy" ? "warning" : "danger"
                  }
                >
                  {t(`amenities.status.${a.status}`)}
                </Badge>
                {a.status === "closed" ? (
                  <Button size="sm" variant="secondary" onClick={() => void setAmenityStatus(a.id, "available")}>
                    {t("ops.openAmenity")}
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => void setAmenityStatus(a.id, "closed")}>
                    {t("ops.closeAmenity")}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ZoneBar({ zone, capacityLabel }: { zone: Zone; capacityLabel: string }) {
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{zone.name}</span>
        <span className="text-night-100">
          {Math.round(zone.densityPct)}% · {capacityLabel} {zone.capacity.toLocaleString()}
        </span>
      </div>
      <Meter value={zone.densityPct} />
    </li>
  );
}

/** Accessible meter: uses role=meter with aria values so screen readers get the
 *  number, and colour only reinforces (never conveys) the level. */
function Meter({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const tone = pct > 80 ? "bg-flag-red" : pct > 60 ? "bg-flag-gold" : "bg-pitch-500";
  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-border"
    >
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}
