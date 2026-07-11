import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RequestedRole } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { AuthShell } from "./AuthShell";
import { RoleChooser } from "./RoleChooser";
import { useAuth } from "./useAuth";
import { landingRoute } from "./roles";

/** Shown to a brand-new (e.g. Google) user: name/email come from the provider;
 *  they confirm details and pick a role to finish creating their account. */
export function CompleteProfilePage() {
  const { t } = useTranslation();
  const { user, role, status, needsProfile, loading, completeProfile } = useAuth();

  const [first, ...rest] = (user?.displayName ?? "").split(" ");
  const [firstName, setFirstName] = useState(first ?? "");
  const [lastName, setLastName] = useState(rest.join(" "));
  const [phone, setPhone] = useState("");
  const [requestedRole, setRequestedRole] = useState<RequestedRole>("fan");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && !user) return <Navigate to="/signin" replace />;
  // Once the profile exists, move on to the right destination.
  if (!loading && user && !needsProfile) {
    return <Navigate to={landingRoute({ role, status, needsProfile })} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await completeProfile({ firstName, lastName, phone: phone || undefined, requestedRole });
    } catch {
      setError(t("common.error"));
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {t("complete.title")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("complete.sub")}</p>
      </div>

      {user?.email && (
        <div className="mt-5 rounded-xl border border-surface-border bg-surface p-3 text-sm">
          <span className="text-fg-muted">{t("auth.email")}: </span>
          <span className="font-medium">{user.email}</span>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
        <RoleChooser value={requestedRole} onChange={setRequestedRole} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("auth.firstName")} required>
            {(props) => (
              <Input {...props} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            )}
          </Field>
          <Field label={t("auth.lastName")} required>
            {(props) => (
              <Input {...props} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            )}
          </Field>
        </div>
        <Field label={t("auth.phone")} hint={t("auth.phoneHint")}>
          {(props) => (
            <Input {...props} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          )}
        </Field>
        <Button type="submit" block size="lg" loading={busy} disabled={!firstName}>
          {t("complete.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
