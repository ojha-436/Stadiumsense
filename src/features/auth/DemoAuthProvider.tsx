import { useMemo, useSyncExternalStore } from "react";
import { demoAuth } from "@/lib/demo/auth";
import { AuthContext, type AuthContextValue, type ProfileData, type SignUpData } from "./context";

/**
 * Auth provider used only in demo mode. It drives the same account lifecycle as
 * the real provider (sign-up, role request, pending status, Google
 * complete-profile) against the in-memory demo controller, so the full flow is
 * exercised with no backend.
 */
export function DemoAuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const snapshot = useSyncExternalStore(demoAuth.subscribe, demoAuth.getSnapshot);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user: demoAuth.user(),
      role: demoAuth.role(),
      stallId: demoAuth.stallId(),
      active: true,
      status: demoAuth.status(),
      requestedRole: demoAuth.requestedRole(),
      needsProfile: demoAuth.needsProfile(),
      loading: false,
      signInEmail: async () => demoAuth.signInEmail(),
      signUpEmail: async (data: SignUpData) => demoAuth.signUpEmail(data),
      signInGoogle: async () => demoAuth.startGoogle(),
      completeProfile: async (data: ProfileData) => demoAuth.completeProfile(data),
      signOut: async () => demoAuth.signOut(),
      refreshClaims: async () => undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
