import { beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FanProfile, TransportMode } from "@/types/domain";
// Importing the app i18n instance initializes it with the real EN/ES/FR
// resources, so `t()` returns the actual localized copy (and interpolates)
// instead of echoing raw key paths — which lets us assert on rendered text.
import i18n from "@/i18n";
import { SustainabilityInsight } from "./SustainabilityInsight";

/** Minimal valid fan profile; only `transportMode` drives this component. */
function profileWith(transportMode: TransportMode): FanProfile {
  return {
    id: "fan-1",
    matchId: "demo-final",
    seat: { section: "A", row: "1", seat: "1" },
    transportMode,
    partySize: 1,
    accessibilityNeeds: [],
    source: "questionnaire",
    updatedAt: 0,
  };
}

describe("SustainabilityInsight", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  it("always renders the localized card title", () => {
    render(<SustainabilityInsight profile={profileWith("transit")} />);
    expect(screen.getByText("Your travel impact")).toBeInTheDocument();
  });

  it("shows the CO₂ saving and tree-equivalent copy for transit", () => {
    render(<SustainabilityInsight profile={profileWith("transit")} />);
    expect(screen.getByText(/public transit/)).toBeInTheDocument();
    expect(screen.getByText(/kg of CO/)).toBeInTheDocument();
    expect(screen.getByText(/tree seedlings absorb/)).toBeInTheDocument();
  });

  it("names walking as the chosen mode when walking", () => {
    render(<SustainabilityInsight profile={profileWith("walking")} />);
    expect(screen.getByText(/\bwalking\b/)).toBeInTheDocument();
    expect(screen.getByText(/tree seedlings absorb/)).toBeInTheDocument();
  });

  it("shows the no-savings message for driving and omits the savings copy", () => {
    render(<SustainabilityInsight profile={profileWith("driving")} />);
    expect(screen.getByText(/No emissions savings estimated/)).toBeInTheDocument();
    expect(screen.queryByText(/tree seedlings absorb/)).not.toBeInTheDocument();
  });

  it("treats rideshare like driving (car travel, no savings)", () => {
    render(<SustainabilityInsight profile={profileWith("rideshare")} />);
    expect(screen.getByText(/No emissions savings estimated/)).toBeInTheDocument();
  });

  it("never leaks an unresolved i18n key path into the DOM", () => {
    const { container } = render(<SustainabilityInsight profile={profileWith("transit")} />);
    expect(container.textContent).not.toMatch(/sustainability\./);
  });
});
