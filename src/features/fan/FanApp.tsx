import { Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, Home, MapPin, Users, UtensilsCrossed } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/useAuth";
import { useFanProfile } from "./hooks";
import { OnboardingPage } from "./onboarding/OnboardingPage";
import { HomePage } from "./pages/HomePage";
import { MatchPage } from "./pages/MatchPage";
import { FoodPage } from "./pages/FoodPage";
import { AmenitiesPage } from "./pages/AmenitiesPage";
import { WallPage } from "./pages/WallPage";

/**
 * Fan surface. Until the fan has a matchday profile (from ticket scan or the
 * questionnaire) we show onboarding full-screen; afterwards the tabbed app.
 */
export default function FanApp() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, loading } = useFanProfile(user?.uid ?? null);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label={t("common.loading")} />
      </div>
    );
  }

  if (!profile) {
    return <OnboardingPage uid={user!.uid} />;
  }

  const nav: NavItem[] = [
    { to: "/fan", label: t("nav.home"), icon: Home },
    { to: "/fan/match", label: t("nav.match"), icon: CalendarClock },
    { to: "/fan/food", label: t("nav.food"), icon: UtensilsCrossed },
    { to: "/fan/amenities", label: t("nav.amenities"), icon: MapPin },
    { to: "/fan/wall", label: t("nav.wall"), icon: Users },
  ];

  return (
    <AppShell nav={nav}>
      <Routes>
        <Route index element={<HomePage profile={profile} />} />
        <Route path="match" element={<MatchPage profile={profile} />} />
        <Route path="food" element={<FoodPage profile={profile} />} />
        <Route path="amenities" element={<AmenitiesPage profile={profile} />} />
        <Route path="wall" element={<WallPage profile={profile} />} />
      </Routes>
    </AppShell>
  );
}
