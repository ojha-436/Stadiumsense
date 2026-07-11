import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AuthShell } from "./AuthShell";
import { useAuth } from "./useAuth";
import { landingRoute } from "./roles";

const ROLE_LABEL: Record<string, string> = { vendor: "role.vendor", ops: "role.operator" };

/** Waiting room for vendor/operator accounts whose access request an admin has
 *  not yet approved. Re-routes automatically once the role is granted. */
export function PendingApprovalPage() {
  const { t } = useTranslation();
  const { user, role, status, requestedRole, needsProfile, loading, signOut, refreshClaims } =
    useAuth();

  if (!loading && !user) return <Navigate to="/signin" replace />;
  if (!loading && user && status === "active" && !needsProfile) {
    return <Navigate to={landingRoute({ role, status, needsProfile })} replace />;
  }

  const roleLabel = requestedRole ? t(ROLE_LABEL[requestedRole] ?? "role.operator") : "";

  return (
    <AuthShell>
      <div className="animate-fade-in text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
          <Clock className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">
          {t("pending.title")}
        </h1>
        <p className="mt-3 text-fg-muted">
          {t("pending.sub", { name: user?.displayName ?? "", role: roleLabel })}
        </p>

        {status === "rejected" && (
          <Alert tone="error" className="mt-5 text-left">
            {t("common.error")}
          </Alert>
        )}

        <div className="mt-6 rounded-xl border border-surface-border bg-surface p-4 text-sm text-fg-muted">
          {t("pending.note")}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => void refreshClaims()}>
            {t("pending.checkAgain")}
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
