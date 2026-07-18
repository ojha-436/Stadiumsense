import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import type { Lang, Order } from "@/types/domain";
import { formatMoney, formatRelative } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { seatLabel } from "@/features/fan/seat";
import { advanceOrder } from "./actions";

const ACTIVE: Order["status"][] = ["placed", "accepted", "preparing", "delivering"];

/** Live vendor order queue. New orders arrive instantly via the Firestore
 *  listener; the vendor advances each through the fulfilment flow. */
export function OrderQueue({ orders, lang }: { orders: Order[]; lang: Lang }): JSX.Element {
  const { t } = useTranslation();
  const now = Date.now();
  const active = orders.filter((o) => ACTIVE.includes(o.status));

  if (active.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-night-100">{t("vendor.noOrders")}</p>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-live="polite">
      {active.map((order) => (
        <li key={order.id}>
          <Card>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={order.status === "placed" ? "warning" : "info"}>
                  {t(`food.status.${order.status}`)}
                </Badge>
                <span className="text-xs text-night-100">
                  {formatRelative(order.createdAt, now, lang)}
                </span>
              </div>
              <span className="font-mono text-sm">{formatMoney(order.total, lang)}</span>
            </div>

            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {order.items.map((item) => (
                <li key={item.itemId}>
                  {item.qty}× {item.name}
                </li>
              ))}
            </ul>

            <p className="mt-2 text-xs text-night-100">
              {t("food.deliverTo", { seat: seatLabel(order.seat) })}
            </p>

            <Button className="mt-3" size="sm" onClick={() => void advanceOrder(order)}>
              {t("vendor.advance")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
