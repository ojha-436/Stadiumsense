/**
 * Seed dataset for demo mode — mirrors scripts/seed.ts but as plain in-memory
 * documents keyed by id. Values are stored raw (no id field); the shared
 * mappers hydrate the id, exactly as with real Firestore documents.
 */
type Doc = Record<string, unknown>;
export type Collections = Record<string, Map<string, Doc>>;

export const DEMO_MATCH_ID = "demo-final";
export const DEMO_STALL_ID = "stall-tacos";

type Pos = "GK" | "DF" | "MF" | "FW";
const POSITIONS: Pos[] = ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"];

function lineup(teamName: string, teamCode: string, formation: string, names: string[]) {
  const players = names.slice(0, 11).map((name, i) => ({
    number: i + 1,
    name,
    position: POSITIONS[i] ?? "MF",
    isStarter: true,
  }));
  players.push({ number: 12, name: `${teamCode} Sub 1`, position: "MF", isStarter: false });
  players.push({ number: 13, name: `${teamCode} Sub 2`, position: "FW", isStarter: false });
  return { teamName, teamCode, formation, players };
}

export function buildDemoCollections(now: number): Collections {
  const kickoff = now + 2 * 60 * 60 * 1000;
  const col = (entries: Array<[string, Doc]>) => new Map(entries);

  return {
    matches: col([
      [
        DEMO_MATCH_ID,
        {
          stadiumId: "metlife",
          venueName: "MetLife Stadium",
          city: "New York / New Jersey",
          country: "USA",
          kickoff,
          stage: "Final",
          home: lineup("Spain", "ESP", "4-3-3", [
            "Simón", "Carvajal", "Laporte", "Le Normand", "Cucurella",
            "Rodri", "Pedri", "Fabián", "Yamal", "Morata", "Nico Williams",
          ]),
          away: lineup("Argentina", "ARG", "4-4-2", [
            "E. Martínez", "Molina", "Otamendi", "Romero", "Tagliafico",
            "De Paul", "Mac Allister", "Fernández", "Di María", "Messi", "Álvarez",
          ]),
        },
      ],
    ]),
    zones: col([
      ["north", zone(now, "North Concourse", 22000, 58, "rising")],
      ["south", zone(now, "South Concourse", 22000, 41, "steady")],
      ["east", zone(now, "East Concourse", 18000, 33, "steady")],
      ["west", zone(now, "West Concourse", 18000, 72, "rising")],
    ]),
    gates: col([
      ["gate-A", gate(now, "Gate A", 6)],
      ["gate-B", gate(now, "Gate B", 11)],
      ["gate-C", gate(now, "Gate C", 4)],
      ["gate-D", gate(now, "Gate D", 14)],
    ]),
    transitLines: col([
      ["line-rail", transit(now, "Meadowlands Rail", "train", 68, 10)],
      ["line-express", transit(now, "Express Bus 351", "bus", 47, 6)],
      ["line-metro", transit(now, "Downtown Metro", "metro", 81, 4)],
    ]),
    amenities: col([
      ["water-n1", amenity(now, "water", "Water Refill — North", "North Concourse")],
      ["water-s1", amenity(now, "water", "Water Refill — South", "South Concourse")],
      ["toilet-n1", amenity(now, "toilet", "Restrooms — North 114", "North Concourse")],
      ["toilet-e1", amenity(now, "toilet", "Restrooms — East 210", "East Concourse")],
      ["firstaid-1", amenity(now, "firstaid", "First Aid — Main", "West Concourse")],
    ]),
    incidents: col([
      [
        "seed-inc-1",
        {
          matchId: DEMO_MATCH_ID,
          type: "Crowd congestion",
          zone: "West Concourse",
          source: "simulator",
          severity: "medium",
          description: "Density building near the West Concourse entrance.",
          status: "open",
          createdAt: now - 4 * 60000,
        },
      ],
    ]),
    stalls: col([
      [DEMO_STALL_ID, stall("Azteca Tacos", "North Concourse", [
        ["taco-beef", "Beef Taco", 650, false],
        ["taco-veg", "Veggie Taco", 600, true],
        ["nachos", "Loaded Nachos", 850, true],
      ])],
      ["stall-dogs", stall("Home Run Hot Dogs", "South Concourse", [
        ["dog-classic", "Classic Hot Dog", 700, false],
        ["dog-veg", "Veggie Dog", 700, true],
        ["fries", "Stadium Fries", 500, true],
      ])],
      ["stall-drinks", stall("Center Circle Drinks", "East Concourse", [
        ["water", "Bottled Water", 300, true],
        ["soda", "Soft Drink", 450, true],
        ["coffee", "Hot Coffee", 400, true],
      ])],
    ]),
    orders: col([]),
    // Seeded fan check-ins so the operator chatbot has real fan-supplied data
    // to ground its answers on (sections, transport, accessibility, party size).
    fanProfiles: col([
      fanProfile("f1", "114", "transit", 2, []),
      fanProfile("f2", "118", "transit", 4, ["wheelchair"]),
      fanProfile("f3", "232", "driving", 1, []),
      fanProfile("f4", "114", "rideshare", 3, ["step-free"]),
      fanProfile("f5", "301", "transit", 2, ["low-vision"]),
      fanProfile("f6", "118", "walking", 5, []),
      fanProfile("f7", "114", "transit", 2, ["sensory-friendly"]),
      fanProfile("f8", "232", "driving", 2, []),
    ]),
    posts: col([]),
    polls: col([
      [
        "poll-winner",
        {
          matchId: DEMO_MATCH_ID,
          question: "Who will win the final?",
          kind: "winner",
          options: [
            { optionId: "esp", label: "Spain", count: 42 },
            { optionId: "arg", label: "Argentina", count: 51 },
            { optionId: "draw", label: "Draw (to penalties)", count: 18 },
          ],
          createdBy: "system",
          createdAt: now,
        },
      ],
    ]),
    users: col([
      ["demo-vendor", { role: "vendor", displayName: "Azteca Tacos", email: "vendor@demo", lang: "en", active: true, stallId: DEMO_STALL_ID, createdAt: now }],
      ["demo-ops", { role: "ops", displayName: "Ops Room", email: "ops@demo", lang: "en", active: true, createdAt: now }],
    ]),
  };
}

function zone(now: number, name: string, capacity: number, densityPct: number, trend: string): Doc {
  return { matchId: DEMO_MATCH_ID, name, capacity, densityPct, trend, updatedAt: now };
}
function gate(now: number, label: string, queueMins: number): Doc {
  return { matchId: DEMO_MATCH_ID, label, queueMins, throughputPerMin: 40, status: "open", updatedAt: now };
}
function transit(now: number, name: string, mode: string, loadPct: number, headwayMins: number): Doc {
  return { matchId: DEMO_MATCH_ID, name, mode, loadPct, headwayMins, updatedAt: now };
}
function amenity(now: number, type: string, label: string, zoneName: string): Doc {
  return { matchId: DEMO_MATCH_ID, type, label, zone: zoneName, status: "available", updatedAt: now };
}
function fanProfile(
  id: string,
  section: string,
  transportMode: string,
  partySize: number,
  accessibilityNeeds: string[]
): [string, Doc] {
  return [
    id,
    {
      matchId: DEMO_MATCH_ID,
      seat: { section, row: "R", seat: "7" },
      transportMode,
      partySize,
      accessibilityNeeds,
      source: "questionnaire",
      updatedAt: Date.now(),
    },
  ];
}

function stall(name: string, zoneName: string, menu: Array<[string, string, number, boolean]>): Doc {
  return {
    matchId: DEMO_MATCH_ID,
    name,
    zone: zoneName,
    vendorUid: "demo-vendor",
    open: true,
    menu: menu.map(([itemId, itemName, priceCents, veg]) => ({
      itemId,
      name: itemName,
      priceCents,
      stock: 50,
      soldOut: false,
      veg,
    })),
  };
}
