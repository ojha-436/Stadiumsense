import { Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";

/** Honest labelling: crowd/transit figures come from the demo simulator, not
 *  real sensors. Shown on every operational surface that renders that data. */
export function SimulatedBadge(): JSX.Element {
  const { t } = useTranslation();
  return (
    <Badge tone="info" className="animate-pulse-soft">
      <Radio className="h-3 w-3" aria-hidden="true" />
      {t("ops.simulated")}
    </Badge>
  );
}
