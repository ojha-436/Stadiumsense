import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import type { RequestedRole } from "@/types/domain";
import { AuthShell } from "./AuthShell";
import { RoleChooser } from "./RoleChooser";
import { useAuth } from "./useAuth";
import { landingRoute } from "./roles";

type Mode = "in" | "up";

export function SignInPage() {
  const { t } = useTranslation();
  const { user, role, status, needsProfile, loading, signInEmail, signUpEmail, signInGoogle } =
    useAuth();
  const [mode, setMode] = useState<Mode>("in");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<RequestedRole>("fan");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && !loading) return <Navigate to={landingRoute({ role, status, needsProfile })} replace />;

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof FirebaseError ? friendly(err.code, t) : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(() =>
      mode === "up"
        ? signUpEmail({ firstName, lastName, email, phone: phone || undefined, password, requestedRole })
        : signInEmail(email, password)
    );
  };

  const isUp = mode === "up";

  return (
    <AuthShell>
      <div>
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {isUp ? t("auth.createTitle") : t("auth.signInTitle")}
            </h1>
            <p className="mt-2 text-fg-muted">{isUp ? t("auth.createSub") : t("auth.signInSub")}</p>
          </div>

          {error && (
            <Alert tone="error" className="mt-6">
              {error}
            </Alert>
          )}

          <Button
            variant="secondary"
            block
            size="lg"
            className="mt-6 border border-surface-border bg-surface font-semibold"
            onClick={() => void run(signInGoogle)}
            loading={busy}
          >
            <GoogleIcon className="h-5 w-5" />
            {t("auth.continueGoogle")}
          </Button>

          <div className="my-6 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-fg-muted">
            <span className="h-px flex-1 bg-surface-border" />
            {t("auth.orContinue")}
            <span className="h-px flex-1 bg-surface-border" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {isUp && <RoleChooser value={requestedRole} onChange={setRequestedRole} />}
            {isUp && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("auth.firstName")} required>
                  {(props) => (
                    <Input
                      {...props}
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  )}
                </Field>
                <Field label={t("auth.lastName")} required>
                  {(props) => (
                    <Input
                      {...props}
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  )}
                </Field>
              </div>
            )}

            <Field label={t("auth.email")} required>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}
            </Field>

            {isUp && (
              <Field label={t("auth.phone")} hint={t("auth.phoneHint")}>
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                )}
              </Field>
            )}

            <Field label={t("auth.password")} required>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  autoComplete={isUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
            </Field>

            <Button type="submit" block size="lg" loading={busy} className="mt-1">
              {isUp ? t("auth.signUp") : t("auth.signIn")}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(isUp ? "in" : "up");
              setError(null);
            }}
            className="mt-6 text-center text-sm text-fg-muted transition-colors hover:text-fg"
          >
            {isUp ? t("auth.haveAccount") : t("auth.needAccount")}
          </button>

          <p className="mt-6 text-center text-xs text-fg-muted/80">{t("auth.termsNote")}</p>
      </div>
    </AuthShell>
  );
}

function friendly(code: string, t: (k: string) => string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in.";
    case "auth/weak-password":
      return "Choose a password of at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    default:
      return t("common.error");
  }
}
