import { useTranslation } from "react-i18next";
import { Store, Ticket, Radio, type LucideIcon } from "lucide-react";
import type { RequestedRole } from "@/types/domain";
import { cn } from "@/lib/cn";

const OPTIONS: Array<{ value: RequestedRole; icon: LucideIcon; labelKey: string; descKey: string }> = [
  { value: "fan", icon: Ticket, labelKey: "role.fan", descKey: "role.fanDesc" },
  { value: "vendor", icon: Store, labelKey: "role.vendor", descKey: "role.vendorDesc" },
  { value: "ops", icon: Radio, labelKey: "role.operator", descKey: "role.operatorDesc" },
];

/** Accessible role selector (radiogroup) used on sign-up and complete-profile. */
export function RoleChooser({
  value,
  onChange,
}: {
  value: RequestedRole;
  onChange: (role: RequestedRole) => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-fg-muted">{t("role.choose")}</p>
      <div role="radiogroup" aria-label={t("role.choose")} className="grid gap-2">
        {OPTIONS.map(({ value: v, icon: Icon, labelKey, descKey }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-surface-border hover:border-fg-muted"
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg",
                  active ? "bg-primary/20 text-primary-400" : "bg-inset text-fg-muted"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-fg">{t(labelKey)}</span>
                <span className="block text-xs text-fg-muted">{t(descKey)}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 flex-shrink-0 rounded-full border-2",
                  active ? "border-primary bg-primary" : "border-surface-border"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
