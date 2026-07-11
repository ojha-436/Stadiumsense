import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Droplet, Cross, Bath } from "lucide-react";
import type { Amenity, AmenityType, FanProfile } from "@/types/domain";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useAmenities } from "../hooks";

const ICON: Record<AmenityType, typeof Droplet> = {
  water: Droplet,
  toilet: Bath,
  firstaid: Cross,
};
const STATUS_TONE = { available: "success", busy: "warning", closed: "danger" } as const;

export function AmenitiesPage({ profile }: { profile: FanProfile }) {
  const { t } = useTranslation();
  const { data: amenities, loading } = useAmenities(profile.matchId);

  // Proximity heuristic: amenities whose zone name contains the fan's section
  // prefix sort first, then by availability. Real deployments would use the
  // geo coordinates already modelled on the Amenity type.
  const sorted = useMemo(() => {
    const prefix = profile.seat.section.slice(0, 1);
    return [...amenities].sort((a, b) => proximity(a, prefix) - proximity(b, prefix));
  }, [amenities, profile.seat.section]);

  if (loading) return <Spinner label={t("common.loading")} className="py-10" />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t("amenities.title")}</h1>
        <p className="text-sm text-night-100">
          {t("amenities.nearestFirst", { section: profile.seat.section || "—" })}
        </p>
      </div>

      <Card>
        <ul className="flex flex-col divide-y divide-surface-border">
          {sorted.map((a) => {
            const Icon = ICON[a.type];
            return (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <div className="rounded-lg bg-night-950 p-2">
                  <Icon className="h-5 w-5 text-flag-blue" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{a.label || t(`amenities.${a.type}`)}</p>
                  <p className="text-xs text-night-100">{a.zone}</p>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{t(`amenities.status.${a.status}`)}</Badge>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function proximity(a: Amenity, sectionPrefix: string): number {
  const near = sectionPrefix && a.zone.includes(sectionPrefix) ? 0 : 10;
  const avail = { available: 0, busy: 1, closed: 2 }[a.status];
  return near + avail;
}
