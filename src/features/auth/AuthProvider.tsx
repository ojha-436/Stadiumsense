import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { mapUser } from "@/lib/mappers";
import type { RequestedRole, Role, UserDoc } from "@/types/domain";
import { AuthContext, type AuthState, type ProfileData, type SignUpData } from "./context";
import { createUserProfile } from "./profile";

const INITIAL: AuthState = {
  user: null,
  role: "fan",
  stallId: null,
  active: true,
  status: "active",
  requestedRole: null,
  needsProfile: false,
  loading: true,
};

interface Claims {
  role: Role;
  stallId: string | null;
}

async function readClaims(user: User): Promise<Claims> {
  const token = await user.getIdTokenResult();
  return {
    role: (token.claims.role as Role | undefined) ?? "fan",
    stallId: (token.claims.stallId as string | undefined) ?? null,
  };
}

/**
 * Authentication state. Two sources are combined:
 *  - the ID token's custom claims (authoritative role/stallId), and
 *  - the users/{uid} document (profile + access-request status).
 * The document also tells us whether a brand-new (e.g. Google) user still needs
 * to complete their profile, so the app can route them to that step.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL);
  const docUnsub = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    return onIdTokenChanged(auth, async (user) => {
      docUnsub.current?.();
      docUnsub.current = null;

      if (!user) {
        setState({ ...INITIAL, loading: false });
        return;
      }

      const claims = await readClaims(user);
      // Subscribe to the profile doc so status/approval changes are live.
      docUnsub.current = onSnapshot(doc(db, COLLECTIONS.users, user.uid), (snap) => {
        const profile: UserDoc | null = snap.exists() ? mapUser(snap.id, snap.data()) : null;
        setState({
          user,
          role: claims.role,
          stallId: claims.stallId,
          active: profile ? profile.active : true,
          status: profile ? profile.status : "active",
          requestedRole: (profile?.requestedRole as RequestedRole | undefined) ?? null,
          needsProfile: profile === null,
          loading: false,
        });
      });
    });
  }, []);

  useEffect(() => () => docUnsub.current?.(), []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(async (data: SignUpData) => {
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await updateProfile(cred.user, { displayName });
    await createUserProfile({ uid: cred.user.uid, ...data });
  }, []);

  // Popup only — the profile doc is written in completeProfile once the user
  // has chosen a role, so a new Google user is routed to that step first.
  const signInGoogle = useCallback(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const completeProfile = useCallback(async (data: ProfileData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");
    const [firstName, ...rest] = (user.displayName ?? "").split(" ");
    await createUserProfile({
      uid: user.uid,
      firstName: data.firstName || firstName || "Fan",
      lastName: data.lastName || rest.join(" "),
      email: user.email ?? "",
      phone: data.phone,
      requestedRole: data.requestedRole,
    });
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const refreshClaims = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.getIdToken(true);
    const claims = await readClaims(auth.currentUser);
    setState((prev) => ({ ...prev, ...claims }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      signInEmail,
      signUpEmail,
      signInGoogle,
      completeProfile,
      signOut,
      refreshClaims,
    }),
    [state, signInEmail, signUpEmail, signInGoogle, completeProfile, signOut, refreshClaims]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
