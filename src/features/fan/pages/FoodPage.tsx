import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus, ShoppingCart, Store } from "lucide-react";
import type { FanProfile, Lang, MenuItem, Stall } from "@/types/domain";
import { formatMoney } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/useAuth";
import { useMyOrders, useStalls } from "../hooks";
import { seatLabel } from "../seat";
import { useCart } from "../food/useCart";
import { placeOrder, cancelOrder } from "../food/placeOrder";
import { OrderTracker } from "../components/OrderTracker";

export function FoodPage({ profile }: { profile: FanProfile }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as Lang) ?? "en";
  const { user } = useAuth();
  const { data: stalls, loading } = useStalls(profile.matchId);
  const { data: orders } = useMyOrders(user?.uid ?? null);
  const cart = useCart();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const checkout = async () => {
    if (!user || !cart.stallId || !cart.stallName) return;
    setPlacing(true);
    try {
      await placeOrder({
        fanUid: user.uid,
        matchId: profile.matchId,
        stallId: cart.stallId,
        stallName: cart.stallName,
        seat: profile.seat,
        lines: cart.lines,
        totalCents: cart.totalCents,
      });
      cart.clear();
      setPlaced(true);
    } finally {
      setPlacing(false);
    }
  };


  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t("food.title")}</h1>
        <p className="text-sm text-night-100">
          {t("food.subtitle", { seat: seatLabel(profile.seat) })}
        </p>
      </div>

      {placed && (
        <Alert tone="success" title={t("food.orderPlaced")}>
          {t("food.mockPayNote")}
        </Alert>
      )}

      {/* Live order tracking */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("food.orderStatus")}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id}>
                <OrderTracker order={order} />
                {order.status === "placed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-flag-red"
                    onClick={() => void cancelOrder(order)}
                  >
                    {t("food.cancel")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cart */}
      {cart.count > 0 && (
        <Card className="border-flag-gold/40">
          <CardHeader>
            <ShoppingCart className="h-5 w-5 text-flag-gold" aria-hidden="true" />
            <CardTitle>{t("food.cart")}</CardTitle>
          </CardHeader>
          <ul className="flex flex-col gap-2">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {line.qty}× {line.name}
                </span>
                <span className="font-mono">{formatMoney(line.priceCents * line.qty, lang)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
            <span className="font-semibold">{t("food.total")}</span>
            <span className="font-mono text-lg font-bold">{formatMoney(cart.totalCents, lang)}</span>
          </div>
          <p className="mt-2 text-xs text-night-100">
            {t("food.deliverTo", { seat: seatLabel(profile.seat) })}
          </p>
          <Button block className="mt-3" loading={placing} onClick={() => void checkout()}>
            {placing ? t("food.placing") : t("food.checkout")}
          </Button>
          <p className="mt-2 text-center text-xs text-night-100/70">{t("food.mockPayNote")}</p>
        </Card>
      )}

      {/* Stalls */}
      {loading ? (
        <Spinner label={t("common.loading")} className="py-10" />
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("food.browseStalls")}</h2>
          {stalls.map((stall) => (
            <StallCard
              key={stall.id}
              stall={stall}
              lang={lang}
              inCartQty={(itemId) => cart.lines.find((l) => l.itemId === itemId)?.qty ?? 0}
              onAdd={(item) => cart.add(stall, item)}
              onRemove={(item) => cart.remove(item.itemId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StallCard({
  stall,
  lang,
  inCartQty,
  onAdd,
  onRemove,
}: {
  stall: Stall;
  lang: Lang;
  inCartQty: (itemId: string) => number;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Store className="h-5 w-5 text-night-100" aria-hidden="true" />
        <CardTitle>{stall.name}</CardTitle>
        <Badge tone="neutral" className="ml-1">
          {stall.zone}
        </Badge>
        {!stall.open && (
          <Badge tone="danger" className="ml-auto">
            {t("food.closed")}
          </Badge>
        )}
      </div>
      <ul className="flex flex-col divide-y divide-surface-border">
        {stall.menu.map((item) => {
          const qty = inCartQty(item.itemId);
          const disabled = item.soldOut || item.stock <= 0 || !stall.open;
          return (
            <li key={item.itemId} className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium">
                  {item.name}
                  {item.veg && (
                    <span className="ml-1 text-pitch-400" aria-label="vegetarian">
                      ●
                    </span>
                  )}
                </p>
                <p className="text-xs text-night-100">{formatMoney(item.priceCents, lang)}</p>
              </div>
              {disabled ? (
                <Badge tone="danger">{t("food.soldOut")}</Badge>
              ) : qty > 0 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`remove ${item.name}`}
                    onClick={() => onRemove(item)}
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="w-5 text-center font-semibold" aria-live="polite">
                    {qty}
                  </span>
                  <Button
                    size="sm"
                    aria-label={`add ${item.name}`}
                    onClick={() => onAdd(item)}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => onAdd(item)}>
                  {t("food.addToCart")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
