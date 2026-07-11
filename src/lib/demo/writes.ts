/**
 * Demo-mode write operations against the in-memory store. Where production
 * relies on Cloud Functions triggers (stock decrement on order, vote tallying,
 * post moderation), those side effects are simulated here so the realtime UI
 * behaves end-to-end offline.
 */
import type { MenuItem, Order, SeatLocation, Stall } from "@/types/domain";
import { demoStore } from "./store";
import type { CartLine } from "@/features/fan/food/useCart";
import type { ProfileDraft } from "@/features/fan/onboarding/saveProfile";

const ORDER_FLOW = ["placed", "accepted", "preparing", "delivering", "delivered"] as const;

export function demoSaveProfile(uid: string, draft: ProfileDraft): Promise<void> {
  demoStore.set("fanProfiles", uid, { ...draft, updatedAt: Date.now() });
  return Promise.resolve();
}

export function demoPlaceOrder(params: {
  fanUid: string;
  matchId: string;
  stallId: string;
  stallName: string;
  seat: SeatLocation;
  lines: CartLine[];
  totalCents: number;
}): Promise<string> {
  const now = Date.now();
  const id = demoStore.add("orders", {
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
    createdAt: now,
  });

  // Simulate the onOrderCreated trigger: decrement stock, auto-accept.
  setTimeout(() => {
    const stall = demoStore.get("stalls", params.stallId);
    if (stall) {
      const menu = (stall.data.menu as MenuItem[]) ?? [];
      const updated = menu.map((m) => {
        const line = params.lines.find((l) => l.itemId === m.itemId);
        if (!line) return m;
        const stock = Math.max(0, m.stock - line.qty);
        return { ...m, stock, soldOut: stock <= 0 };
      });
      demoStore.update("stalls", params.stallId, { menu: updated });
    }
    demoStore.update("orders", id, {
      status: "accepted",
      timeline: [
        { status: "placed", at: now },
        { status: "accepted", at: Date.now() },
      ],
    });
  }, 1200);

  return Promise.resolve(id);
}

export function demoAdvanceOrder(order: Order): Promise<void> {
  const idx = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]);
  if (idx < 0 || idx >= ORDER_FLOW.length - 1) return Promise.resolve();
  const next = ORDER_FLOW[idx + 1];
  demoStore.update("orders", order.id, {
    status: next,
    timeline: [...order.timeline, { status: next, at: Date.now() }],
  });
  return Promise.resolve();
}

export function demoCancelOrder(order: Order): Promise<void> {
  demoStore.update("orders", order.id, {
    status: "cancelled",
    timeline: [...order.timeline, { status: "cancelled", at: Date.now() }],
  });
  return Promise.resolve();
}

export function demoSetStallOpen(stallId: string, open: boolean): Promise<void> {
  demoStore.update("stalls", stallId, { open });
  return Promise.resolve();
}

export function demoPatchMenuItem(
  stall: Stall,
  itemId: string,
  patch: Partial<Pick<MenuItem, "soldOut" | "stock">>
): Promise<void> {
  const menu = stall.menu.map((m) => (m.itemId === itemId ? { ...m, ...patch } : m));
  demoStore.update("stalls", stall.id, { menu });
  return Promise.resolve();
}

export function demoSetIncidentStatus(id: string, status: string): Promise<void> {
  demoStore.update("incidents", id, { status });
  return Promise.resolve();
}

export function demoToggleAmenity(id: string, status: string): Promise<void> {
  demoStore.update("amenities", id, { status, updatedAt: Date.now() });
  return Promise.resolve();
}

export function demoCastVote(pollId: string, _uid: string, optionId: string): Promise<void> {
  // Simulate the onVoteCreated aggregation trigger.
  const poll = demoStore.get("polls", pollId);
  if (!poll) return Promise.resolve();
  const options = (poll.data.options as Array<{ optionId: string; label: string; count: number }>) ?? [];
  demoStore.update("polls", pollId, {
    options: options.map((o) => (o.optionId === optionId ? { ...o, count: o.count + 1 } : o)),
  });
  return Promise.resolve();
}

export function demoCreatePost(params: {
  matchId: string;
  authorUid: string;
  authorName: string;
  caption: string;
  playerTag?: string;
}): Promise<void> {
  const now = Date.now();
  const id = demoStore.add("posts", {
    matchId: params.matchId,
    authorUid: params.authorUid,
    authorName: params.authorName,
    caption: params.caption,
    playerTag: params.playerTag ?? null,
    published: false,
    createdAt: now,
  });
  // Simulate the Gemini moderation trigger publishing the post with alt text.
  setTimeout(() => {
    demoStore.update("posts", id, {
      published: true,
      altText: `Fan post: ${params.caption.slice(0, 80)}`,
    });
  }, 1500);
  return Promise.resolve();
}
