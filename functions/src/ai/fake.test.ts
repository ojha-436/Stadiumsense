import { describe, expect, it } from "vitest";
import { FakeGateway } from "./fake.js";
import type { Match } from "../domain.js";

const match: Match = {
  stadiumId: "metlife",
  venueName: "MetLife Stadium",
  city: "NY/NJ",
  country: "USA",
  kickoff: Date.UTC(2026, 6, 19, 20, 0, 0),
  stage: "Final",
  home: { teamName: "Spain", teamCode: "ESP", formation: "4-3-3", players: [] },
  away: { teamName: "Argentina", teamCode: "ARG", formation: "4-4-2", players: [] },
};

describe("FakeGateway.planArrival", () => {
  const gw = new FakeGateway();

  it("recommends leaving before arriving, both before kick-off", async () => {
    const plan = await gw.planArrival({
      match,
      section: "114",
      transportMode: "transit",
      accessibilityNeeds: [],
      lang: "en",
    });
    const leave = Date.parse(plan.leaveByIso);
    const arrive = Date.parse(plan.arriveByIso);
    expect(leave).toBeLessThan(arrive);
    expect(arrive).toBeLessThan(match.kickoff);
    expect(plan.recommendedGate).toBeTruthy();
  });

  it("gives accessibility needs a larger arrival buffer", async () => {
    const base = await gw.planArrival({
      match,
      section: "114",
      transportMode: "transit",
      accessibilityNeeds: [],
      lang: "en",
    });
    const access = await gw.planArrival({
      match,
      section: "114",
      transportMode: "transit",
      accessibilityNeeds: ["wheelchair"],
      lang: "en",
    });
    expect(Date.parse(access.arriveByIso)).toBeLessThan(Date.parse(base.arriveByIso));
  });

  it("localises reasoning by language", async () => {
    const es = await gw.planArrival({
      match,
      section: "114",
      transportMode: "transit",
      accessibilityNeeds: [],
      lang: "es",
    });
    expect(es.reasoning).toMatch(/Puerta|sección/);
  });
});

describe("FakeGateway.moderatePost", () => {
  const gw = new FakeGateway();
  it("allows a normal caption and generates alt text", async () => {
    const r = await gw.moderatePost("Vamos Argentina!");
    expect(r.allowed).toBe(true);
    expect(r.altText.length).toBeGreaterThan(0);
  });
  it("rejects disallowed language", async () => {
    const r = await gw.moderatePost("this contains hateword here");
    expect(r.allowed).toBe(false);
  });
});

describe("FakeGateway.opsBrief", () => {
  const gw = new FakeGateway();
  it("recommends action when a zone is critically dense", async () => {
    const brief = await gw.opsBrief(
      {
        zones: [{ name: "North", densityPct: 92, capacity: 20000, trend: "rising" }],
        gates: [],
        transit: [],
        incidents: [],
        minutesToKickoff: 30,
      },
      "en"
    );
    expect(brief.summary).toContain("North");
    expect(brief.actions.length).toBeGreaterThan(0);
  });
});
