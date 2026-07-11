import { createContext } from "react";
import type { User } from "firebase/auth";
import type { AccountStatus, RequestedRole, Role } from "@/types/domain";

/** Fields collected on sign-up. Phone is optional. */
export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  requestedRole: RequestedRole;
}

/** Fields collected when completing a profile after Google sign-in (name and
 *  email already come from Google, so only these remain). */
export interface ProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
  requestedRole: RequestedRole;
}

export interface AuthState {
  /** Firebase user, or null when signed out. */
  user: User | null;
  /** Role from the verified custom claim; "fan" for self-signup accounts. */
  role: Role;
  /** Vendor's stall id from the custom claim, if any. */
  stallId: string | null;
  /** Whether the account is active (admin can deactivate staff/vendors). */
  active: boolean;
  /** Account lifecycle — "pending" while an access request awaits approval. */
  status: AccountStatus;
  /** The elevated role the user asked for while pending, if any. */
  requestedRole: RequestedRole | null;
  /** Signed in but no profile document yet (e.g. brand-new Google user). */
  needsProfile: boolean;
  /** True until the first auth state + claims resolution completes. */
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (data: SignUpData) => Promise<void>;
  /** Start Google sign-in. New users land on the complete-profile step. */
  signInGoogle: () => Promise<void>;
  /** Finish a new Google user's profile (name/email came from Google). */
  completeProfile: (data: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  /** Force a token refresh to pick up newly-granted claims. */
  refreshClaims: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
