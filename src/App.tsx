import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEMO } from "@/lib/demo/flag";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { DemoAuthProvider } from "@/features/auth/DemoAuthProvider";
import { RequireRole } from "@/features/auth/RequireRole";
import { SignInPage } from "@/features/auth/SignInPage";
import { CompleteProfilePage } from "@/features/auth/CompleteProfilePage";
import { PendingApprovalPage } from "@/features/auth/PendingApprovalPage";
import { AdminGate } from "@/features/admin/AdminGate";
import { Spinner } from "@/components/ui/Spinner";

// In demo mode auth is mocked (no Firebase); otherwise the real provider runs.
const SessionProvider = DEMO ? DemoAuthProvider : AuthProvider;

// Code-split each role surface so a fan never downloads the ops/vendor/admin
// bundles (keeps the fan PWA lean — an efficiency-rubric win).
const FanApp = lazy(() => import("@/features/fan/FanApp"));
const OpsApp = lazy(() => import("@/features/ops/OpsApp"));
const VendorApp = lazy(() => import("@/features/vendor/VendorApp"));
const AdminApp = lazy(() => import("@/features/admin/AdminApp"));

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label={t("common.loading")} />
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/pending" element={<PendingApprovalPage />} />
            <Route
              path="/fan/*"
              element={
                <RequireRole allow={["fan", "admin"]}>
                  <FanApp />
                </RequireRole>
              }
            />
            <Route
              path="/ops/*"
              element={
                <RequireRole allow={["ops", "admin"]}>
                  <OpsApp />
                </RequireRole>
              }
            />
            <Route
              path="/vendor/*"
              element={
                <RequireRole allow={["vendor", "admin"]}>
                  <VendorApp />
                </RequireRole>
              }
            />
            <Route
              path="/admin/*"
              element={
                <AdminGate>
                  <AdminApp />
                </AdminGate>
              }
            />
            <Route path="*" element={<Navigate to="/fan" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SessionProvider>
  );
}
