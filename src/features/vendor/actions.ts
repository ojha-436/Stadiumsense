import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import { demoAdvanceOrder, demoPatchMenuItem, demoSetStallOpen } from "@/lib/demo/writes";
import { ORDER_FLOW, type MenuItem, type Order, type Stall } from "@/types/domain";

/** Advance an order to the next status in the fulfilment flow (no-op at the end). */
export async function advanceOrder(order: Order): Promise<void> {
  if (DEMO) return demoAdvanceOrder(order);
  const idx = ORDER_FLOW.indexOf(order.status);
  if (idx < 0 || idx >= ORDER_FLOW.length - 1) return;
  const next = ORDER_FLOW[idx + 1];
  await updateDoc(doc(db, COLLECTIONS.orders, order.id), {
    status: next,
    timeline: arrayUnion({ status: next, at: Date.now() }),
  });
}

export async function setStallOpen(stallId: string, open: boolean): Promise<void> {
  if (DEMO) return demoSetStallOpen(stallId, open);
  await updateDoc(doc(db, COLLECTIONS.stalls, stallId), { open });
}

/** Patch a single menu item and write the updated menu array back to the stall. */
export async function patchMenuItem(
  stall: Stall,
  itemId: string,
  patch: Partial<Pick<MenuItem, "soldOut" | "stock">>
): Promise<void> {
  if (DEMO) return demoPatchMenuItem(stall, itemId, patch);
  const menu = stall.menu.map((item) =>
    item.itemId === itemId ? { ...item, ...patch } : item
  );
  await updateDoc(doc(db, COLLECTIONS.stalls, stall.id), { menu });
}
