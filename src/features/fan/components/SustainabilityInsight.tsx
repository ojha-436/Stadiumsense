import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";
import type { FanProfile } from "@/types/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { estimateSustainability } from "../sustainability";

/**
 * Renders the fan's estimated travel sustainability impact (CO2 saved, tree
 * equivalent) as a small card on the fan home page.
 */
export function SustainabilityInsight({ profile }: { profile: FanProfile }): JSX.Element {
  const { t } = useTranslation();

  // 1. Calculate sustainability estimate using default distance (15km)
  const estimate = estimateSustainability(profile.transportMode);
  const co2SavedKg = estimate.co2SavedKg;
  const treesEquivalent = estimate.treesEquivalent;

  return (
    <Card>
      <CardHeader>
        {/* Using text-flag-gold as per instructions fallback */}
        <Leaf className="h-5 w-5 text-flag-gold" aria-hidden="true" />
        <CardTitle>{t("sustainability.title")}</CardTitle>
      </CardHeader>

      {co2SavedKg === null ? (
        // Case: driving or rideshare
        <p className="mt-3 text-sm text-night-50/90">
          {t("sustainability.driving")}
        </p>
      ) : (
        // Case: transit or walking (co2SavedKg is NOT null)
        <>
          {/* Render CO2 saving message */}
          <p className="mt-3 text-sm text-night-50/90">
            {t("sustainability.transitOrWalking", {
              mode: t(`sustainability.mode${profile.transportMode.charAt(0).toUpperCase() + profile.transportMode.slice(1)}`),
              co2: co2SavedKg!.toFixed(1),
            })}
          </p>

          {/* Render Trees Equivalent message */}
          <p className="mt-1 text-sm text-night-50/90">
            {t("sustainability.treesEquivalent", { trees: Math.round(treesEquivalent!) })}
          </p>
        </>
      )}
    </Card>
  );
}
