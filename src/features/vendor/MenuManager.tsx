import { useTranslation } from "react-i18next";
import type { Lang, Stall } from "@/types/domain";
import { formatMoney } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { patchMenuItem, setStallOpen } from "./actions";

const RESTOCK_AMOUNT = 25;

/** Vendor menu & stock control. Stock changes propagate to fans in real time. */
export function MenuManager({ stall, lang }: { stall: Stall; lang: Lang }): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>{stall.open ? t("vendor.open") : t("vendor.closed")}</CardTitle>
          <Button
            size="sm"
            variant={stall.open ? "danger" : "primary"}
            onClick={() => void setStallOpen(stall.id, !stall.open)}
          >
            {stall.open ? t("vendor.closed") : t("vendor.open")}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("vendor.menu")}</CardTitle>
        </CardHeader>
        <ul className="flex flex-col divide-y divide-surface-border">
          {stall.menu.map((item) => {
            const out = item.soldOut || item.stock <= 0;
            return (
              <li key={item.itemId} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-night-100">
                    {formatMoney(item.priceCents, lang)} · {t("vendor.stock", { n: item.stock })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {out && <Badge tone="danger">{t("food.soldOut")}</Badge>}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void patchMenuItem(stall, item.itemId, {
                        stock: item.stock + RESTOCK_AMOUNT,
                        soldOut: false,
                      })
                    }
                  >
                    {t("vendor.restock")}
                  </Button>
                  {!out && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void patchMenuItem(stall, item.itemId, { soldOut: true })}
                    >
                      {t("vendor.markSoldOut")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
