/**
 * Demo auth controller. Models a real-ish account lifecycle entirely in the
 * browser so the sign-up → role-request → admin-approval flow is fully
 * demonstrable offline:
 *   - Fan sign-ups are active immediately.
 *   - Vendor / Stadium Operator sign-ups are `pending` and raise an access
 *     request that the admin portal can approve (granting the elevated role).
 *   - Google sign-in for a new user pauses on `needsProfile` until a role is
 *     chosen on the complete-profile step.
 * A "preview role" shortcut (header switcher) bypasses this for quick viewing.
 */
import type { User } from "firebase/auth";
import type { AccountStatus, RequestedRole, Role } from "@/types/domain";
import { DEMO_STALL_ID } from "./data";
import { demoStore } from "./store";

const KEY = "stadiumsense.demo.account";

export interface DemoAccount {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  status: AccountStatus;
  requestedRole?: RequestedRole;
  stallId?: string;
}

interface GooglePending {
  firstName: string;
  lastName: string;
  email: string;
}

const GOOGLE_IDENTITY: GooglePending = {
  firstName: "Diego",
  lastName: "González",
  email: "diego.gonzalez@gmail.com",
};

class DemoAuthController {
  private account: DemoAccount | null = null;
  private googlePending: GooglePending | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) this.account = JSON.parse(raw) as DemoAccount;
    } catch {
      this.account = null;
    }
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getSnapshot = (): string =>
    JSON.stringify({ a: this.account, g: this.googlePending });

  private persist() {
    try {
      if (this.account) localStorage.setItem(KEY, JSON.stringify(this.account));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }
  private notify() {
    this.persist();
    this.listeners.forEach((cb) => cb());
  }

  // ── Derived state consumed by the provider ─────────────────────────────────
  isAuthed = (): boolean => this.account !== null || this.googlePending !== null;
  needsProfile = (): boolean => this.account === null && this.googlePending !== null;
  role = (): Role => this.account?.role ?? "fan";
  status = (): AccountStatus => this.account?.status ?? "active";
  requestedRole = (): RequestedRole | null => this.account?.requestedRole ?? null;
  stallId = (): string | null => this.account?.stallId ?? null;

  user(): User | null {
    const id = this.account ?? this.googlePending;
    if (!id) return null;
    const uid = this.account?.uid ?? "demo-google";
    return {
      uid,
      displayName: `${id.firstName} ${id.lastName}`.trim(),
      email: id.email,
    } as unknown as User;
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private build(
    identity: { firstName: string; lastName: string; email: string; phone?: string },
    requestedRole: RequestedRole,
    uid: string
  ): DemoAccount {
    const elevated = requestedRole !== "fan";
    const account: DemoAccount = {
      uid,
      firstName: identity.firstName,
      lastName: identity.lastName,
      email: identity.email,
      phone: identity.phone,
      role: "fan",
      status: elevated ? "pending" : "active",
      ...(elevated ? { requestedRole } : {}),
      ...(requestedRole === "vendor" ? { stallId: DEMO_STALL_ID } : {}),
    };
    if (elevated) {
      demoStore.add("accessRequests", {
        uid,
        displayName: `${identity.firstName} ${identity.lastName}`.trim(),
        email: identity.email,
        ...(identity.phone ? { phone: identity.phone } : {}),
        requestedRole,
        status: "pending",
        createdAt: Date.now(),
      });
    }
    return account;
  }

  signUpEmail = (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    requestedRole: RequestedRole;
  }): void => {
    this.googlePending = null;
    this.account = this.build(data, data.requestedRole, `demo-${Date.now()}`);
    this.notify();
  };

  /** Returning email user → active fan (demo shortcut). */
  signInEmail = (): void => {
    this.googlePending = null;
    this.account = {
      uid: "demo-fan",
      firstName: "Diego",
      lastName: "Fan",
      email: "diego@demo.local",
      role: "fan",
      status: "active",
    };
    this.notify();
  };

  startGoogle = (): void => {
    this.account = null;
    this.googlePending = { ...GOOGLE_IDENTITY };
    this.notify();
  };

  completeProfile = (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    requestedRole: RequestedRole;
  }): void => {
    const g = this.googlePending ?? GOOGLE_IDENTITY;
    this.account = this.build(
      { firstName: data.firstName, lastName: data.lastName, email: g.email, phone: data.phone },
      data.requestedRole,
      "demo-google"
    );
    this.googlePending = null;
    this.notify();
  };

  signOut = (): void => {
    this.account = null;
    this.googlePending = null;
    this.notify();
  };

  /** Header "preview role" shortcut — jumps straight into a role, approved. */
  viewAs = (role: Role): void => {
    this.googlePending = null;
    this.account = {
      uid: `demo-${role}`,
      firstName: role === "fan" ? "Diego" : role === "vendor" ? "Azteca" : "Ops",
      lastName: role === "fan" ? "González" : role === "vendor" ? "Tacos" : "Room",
      email: `${role}@demo.local`,
      role,
      status: "active",
      ...(role === "vendor" ? { stallId: DEMO_STALL_ID } : {}),
    };
    this.notify();
  };

  /** Admin approves/rejects a request; if it's the signed-in account, apply it. */
  decide = (requestId: string, approve: boolean): void => {
    const req = demoStore.get("accessRequests", requestId);
    if (!req) return;
    demoStore.update("accessRequests", requestId, {
      status: approve ? "approved" : "rejected",
      decidedAt: Date.now(),
    });
    const uid = req.data.uid as string;
    const requestedRole = req.data.requestedRole as Role;
    if (this.account && this.account.uid === uid) {
      this.account = approve
        ? { ...this.account, role: requestedRole, status: "active", requestedRole: undefined }
        : { ...this.account, status: "rejected" };
      this.notify();
    }
  };
}

export const demoAuth = new DemoAuthController();
