import { useTranslation } from "react-i18next";
import { ClipboardList, Store } from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";
import type { Lang } from "@/types/domain";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/features/auth/useAuth";
import { useStall, useStallOrders } from "./hooks";
import { OrderQueue } from "./OrderQueue";
import { MenuManager } from "./MenuManager";

export default function VendorApp() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as Lang) ?? "en";
  const { stallId } = useAuth();
  const { data: stall, loading } = useStall(stallId);
  const { data: orders } = useStallOrders(stallId);

  const nav: NavItem[] = [
    { to: "/vendor", label: t("vendor.orders"), icon: ClipboardList },
    { to: "/vendor/menu", label: t("vendor.menu"), icon: Store },
  ];

  return (
    <AppShell nav={nav}>
      {loading ? (
        <Spinner label={t("common.loading")} className="py-10" />
      ) : !stall ? (
        <Alert tone="warning">{t("common.error")}</Alert>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{stall.name}</h1>
          </div>
          {/* Secondary tabs within the vendor surface */}
          <div className="mb-4 flex gap-2">
            <TabLink to="/vendor" label={t("vendor.orders")} />
            <TabLink to="/vendor/menu" label={t("vendor.menu")} />
          </div>
          <Routes>
            <Route index element={<OrderQueue orders={orders} lang={lang} />} />
            <Route path="menu" element={<MenuManager stall={stall} lang={lang} />} />
          </Routes>
        </>
      )}
    </AppShell>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        "rounded-full px-4 py-1.5 text-sm font-semibold " +
        (isActive ? "bg-flag-gold text-night-950" : "bg-surface-raised text-night-100")
      }
    >
      {label}
    </NavLink>
  );
}
