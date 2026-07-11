import { addDoc, arrayUnion, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import { demoCancelOrder, demoPlaceOrder } from "@/lib/demo/writes";
import type { Order, SeatLocation } from "@/types/domain";
import type { CartLine } from "./useCart";

/**
 * Create an order document. Stock is decremented authoritatively server-side by
 * the onOrderCreated trigger, so this only records the fan's intent. `createdAt`
 * uses a server timestamp so ordering is consistent across clients.
 */
export async function placeOrder(params: {
  fanUid: string;
  matchId: string;
  stallId: string;
  stallName: string;
  seat: SeatLocation;
  lines: CartLine[];
  totalCents: number;
}): Promise<string> {
  if (DEMO) return demoPlaceOrder(params);
  const now = Date.now();
  const ref = await addDoc(collection(db, COLLECTIONS.orders), {
    fanUid: params.fanUid,
    matchId: params.matchId,
    stallId: params.stallId,
    stallName: params.stallName,
    seat: params.seat,
    items: params.lines.map((l) => ({
      itemId: l.itemId,
      name: l.name,
      qty: l.qty,
      priceCents: l.priceCents,
    })),
    total: params.totalCents,
    status: "placed",
    timeline: [{ status: "placed", at: now }],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Fan-initiated cancellation (allowed by rules only while still 'placed'). */
export async function cancelOrder(order: Order): Promise<void> {
  if (DEMO) return demoCancelOrder(order);
  await updateDoc(doc(db, COLLECTIONS.orders, order.id), {
    status: "cancelled",
    timeline: arrayUnion({ status: "cancelled", at: Date.now() }),
    cancelledAt: serverTimestamp(),
  });
}
