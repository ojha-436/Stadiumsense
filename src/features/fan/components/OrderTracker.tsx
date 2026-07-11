import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { ORDER_FLOW, type Order } from "@/types/domain";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

/** Live order progress. Reflects status changes pushed via the Firestore
 *  listener the moment the vendor advances the order. */
export function OrderTracker({ order }: { order: Order }) {
  const { t } = useTranslation();

  if (order.status === "cancelled") {
    return (
      <div className="rounded-xl border border-surface-border bg-night-950 p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{order.stallName}</span>
          <Badge tone="danger">{t("food.status.cancelled")}</Badge>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_FLOW.indexOf(order.status);

  return (
    <div className="rounded-xl border border-surface-border bg-night-950 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">{order.stallName}</span>
        <Badge tone={order.status === "delivered" ? "success" : "info"}>
          {t(`food.status.${order.status}`)}
        </Badge>
      </div>
      <ol className="flex items-center">
        {ORDER_FLOW.map((status, i) => {
          const done = i <= currentIndex;
          const isLast = i === ORDER_FLOW.length - 1;
          return (
            <li key={status} className="flex flex-1 items-center last:flex-none">
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-pitch-500 text-white" : "bg-surface-border text-night-100"
                )}
                aria-label={t(`food.status.${status}`)}
                aria-current={i === currentIndex ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn("h-0.5 flex-1", i < currentIndex ? "bg-pitch-500" : "bg-surface-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
