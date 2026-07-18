import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin.js";
import { computeOrderTotal } from "../lib/orderPricing.js";
import type { OrderLine } from "../domain.js";

interface StallMenuItem {
  itemId: string;
  priceCents: number;
  stock: number;
  soldOut: boolean;
}

/**
 * Authoritative stock reconciliation. The client creates the order (rules
 * validate its shape), but stock is decremented HERE inside a transaction so
 * two fans racing for the last item can never both succeed. If stock is
 * insufficient the order is cancelled with a reason.
 */
export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const order = snap.data() as { stallId: string; items: OrderLine[]; status: string };
  if (order.status !== "placed") return;

  const stallRef = db.doc(`stalls/${order.stallId}`);

  await db.runTransaction(async (tx) => {
    const stallSnap = await tx.get(stallRef);
    if (!stallSnap.exists) {
      tx.update(snap.ref, cancel("stall_unavailable"));
      return;
    }
    const menu = (stallSnap.get("menu") as StallMenuItem[]) ?? [];
    const byId = new Map(menu.map((m) => [m.itemId, m]));

    for (const line of order.items) {
      const item = byId.get(line.itemId);
      if (!item || item.soldOut || item.stock < line.qty) {
        tx.update(snap.ref, cancel("out_of_stock"));
        return;
      }
    }

    const updatedMenu = menu.map((m) => {
      const line = order.items.find((l) => l.itemId === m.itemId);
      if (!line) return m;
      const stock = m.stock - line.qty;
      return { ...m, stock, soldOut: stock <= 0 };
    });

    // Security: never trust the client-submitted total (see orderPricing.ts) —
    // recompute it from the same trusted menu snapshot used for stock reconciliation.
    const total = computeOrderTotal(order.items, menu);

    tx.update(stallRef, { menu: updatedMenu });
    tx.update(snap.ref, {
      status: "accepted",
      total,
      timeline: FieldValue.arrayUnion({ status: "accepted", at: Date.now() }),
    });
  });
});

function cancel(reason: string) {
  return {
    status: "cancelled",
    cancelReason: reason,
    timeline: FieldValue.arrayUnion({ status: "cancelled", at: Date.now() }),
  };
}
