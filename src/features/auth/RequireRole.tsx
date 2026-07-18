import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Role } from "@/types/domain";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "./useAuth";
import { HOME_FOR_ROLE, landingRoute } from "./roles";

/**
 * Route guard. Client-side role gating is a UX convenience only — the real
 * enforcement is in Firestore security rules, so a user who tampers with the
 * client still cannot read or write data outside their role.
 */
export function RequireRole({ allow, children }: { allow: Role[]; children: React.ReactNode }): JSX.Element {
  const { user, role, active, status, needsProfile, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label={t("common.loading")} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  // Route new/ pending accounts to the right place before any dashboard.
  if (needsProfile || status === "pending" || status === "rejected") {
    return <Navigate to={landingRoute({ role, status, needsProfile })} replace />;
  }

  if (!active) {
    return (
      <div className="mx-auto mt-20 max-w-md px-4">
        <Alert tone="error" title={t("common.error")}>
          Your account has been deactivated. Contact the tournament administrator.
        </Alert>
      </div>
    );
  }

  if (!allow.includes(role)) {
    return <Navigate to={HOME_FOR_ROLE[role]} replace />;
  }

  return <>{children}</>;
}
