/**
 * Seed the demo dataset. Idempotent — every document uses a fixed id, so
 * re-running overwrites rather than duplicating.
 *
 * Local (emulator):
 *   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; npm run seed
 * Production:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="path\to\serviceAccount.json"; npm run seed
 */
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.GCLOUD_PROJECT ?? "stadiumsense-wc26";
if (getApps().length === 0) {
  const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  initializeApp(usingEmulator ? { projectId } : { credential: applicationDefault(), projectId });
}
const db = getFirestore();

const MATCH_ID = "demo-final";
const KICKOFF = Date.now() + 2 * 60 * 60 * 1000; // 2 hours out, so plans are live

type Pos = "GK" | "DF" | "MF" | "FW";
const player = (number: number, name: string, position: Pos, isStarter = true) => ({
  number,
  name,
  position,
  isStarter,
});

function lineup(teamName: string, teamCode: string, formation: string, names: string[]) {
  const positions: Pos[] = ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"];
  const players = names
    .slice(0, 11)
    .map((n, i) => player(i + 1, n, positions[i] ?? "MF", true));
  players.push(player(12, `${teamCode} Sub 1`, "MF", false));
  players.push(player(13, `${teamCode} Sub 2`, "FW", false));
  return { teamName, teamCode, formation, players };
}

async function seed() {
  const target = process.env.FIRESTORE_EMULATOR_HOST
    ? `emulator (${process.env.FIRESTORE_EMULATOR_HOST})`
    : `project ${projectId}`;
  console.log(`Seeding StadiumSense demo data into ${target}…`);

  // ── Match + lineups ────────────────────────────────────────────────────────
  await db.doc(`matches/${MATCH_ID}`).set({
    stadiumId: "metlife",
    venueName: "MetLife Stadium",
    city: "New York / New Jersey",
    country: "USA",
    kickoff: KICKOFF,
    stage: "Final",
    home: lineup("Spain", "ESP", "4-3-3", [
      "Simón",
      "Carvajal",
      "Laporte",
      "Le Normand",
      "Cucurella",
      "Rodri",
      "Pedri",
      "Fabián",
      "Yamal",
      "Morata",
      "Nico Williams",
    ]),
    away: lineup("Argentina", "ARG", "4-4-2", [
      "E. Martínez",
      "Molina",
      "Otamendi",
      "Romero",
      "Tagliafico",
      "De Paul",
      "Mac Allister",
      "Fernández",
      "Di María",
      "Messi",
      "Álvarez",
    ]),
  });

  // ── Zones (crowd) ───────────────────────────────────────────────────────────
  const zones = [
    { id: "north", name: "North Concourse", capacity: 22000 },
    { id: "south", name: "South Concourse", capacity: 22000 },
    { id: "east", name: "East Concourse", capacity: 18000 },
    { id: "west", name: "West Concourse", capacity: 18000 },
  ];
  for (const z of zones) {
    await db.doc(`zones/${z.id}`).set({
      matchId: MATCH_ID,
      name: z.name,
      densityPct: 30,
      capacity: z.capacity,
      trend: "steady",
      updatedAt: Date.now(),
    });
  }

  // ── Gates ────────────────────────────────────────────────────────────────────
  for (const g of ["A", "B", "C", "D"]) {
    await db.doc(`gates/gate-${g}`).set({
      matchId: MATCH_ID,
      label: `Gate ${g}`,
      queueMins: 5,
      throughputPerMin: 40,
      status: "open",
      updatedAt: Date.now(),
    });
  }

  // ── Transit lines ─────────────────────────────────────────────────────────────
  const lines = [
    { id: "line-rail", name: "Meadowlands Rail", mode: "train", headwayMins: 10 },
    { id: "line-express", name: "Express Bus 351", mode: "bus", headwayMins: 6 },
    { id: "line-metro", name: "Downtown Metro", mode: "metro", headwayMins: 4 },
  ];
  for (const l of lines) {
    await db.doc(`transitLines/${l.id}`).set({
      matchId: MATCH_ID,
      name: l.name,
      mode: l.mode,
      loadPct: 35,
      headwayMins: l.headwayMins,
      updatedAt: Date.now(),
    });
  }

  // ── Amenities ─────────────────────────────────────────────────────────────────
  const amenities = [
    { id: "water-n1", type: "water", label: "Water Refill — North", zone: "North Concourse" },
    { id: "water-s1", type: "water", label: "Water Refill — South", zone: "South Concourse" },
    { id: "toilet-n1", type: "toilet", label: "Restrooms — North 114", zone: "North Concourse" },
    { id: "toilet-e1", type: "toilet", label: "Restrooms — East 210", zone: "East Concourse" },
    { id: "firstaid-1", type: "firstaid", label: "First Aid — Main", zone: "West Concourse" },
  ];
  for (const a of amenities) {
    await db.doc(`amenities/${a.id}`).set({
      matchId: MATCH_ID,
      type: a.type,
      label: a.label,
      zone: a.zone,
      status: "available",
      updatedAt: Date.now(),
    });
  }

  // ── Stalls + menus ──────────────────────────────────────────────────────────
  const stalls = [
    {
      id: "stall-tacos",
      name: "Azteca Tacos",
      zone: "North Concourse",
      menu: [
        ["taco-beef", "Beef Taco", 650, false],
        ["taco-veg", "Veggie Taco", 600, true],
        ["nachos", "Loaded Nachos", 850, true],
      ],
    },
    {
      id: "stall-dogs",
      name: "Home Run Hot Dogs",
      zone: "South Concourse",
      menu: [
        ["dog-classic", "Classic Hot Dog", 700, false],
        ["dog-veg", "Veggie Dog", 700, true],
        ["fries", "Stadium Fries", 500, true],
      ],
    },
    {
      id: "stall-drinks",
      name: "Center Circle Drinks",
      zone: "East Concourse",
      menu: [
        ["water", "Bottled Water", 300, true],
        ["soda", "Soft Drink", 450, true],
        ["coffee", "Hot Coffee", 400, true],
      ],
    },
  ];
  for (const s of stalls) {
    await db.doc(`stalls/${s.id}`).set({
      matchId: MATCH_ID,
      name: s.name,
      zone: s.zone,
      vendorUid: "demo-vendor",
      open: true,
      menu: s.menu.map(([itemId, name, priceCents, veg]) => ({
        itemId,
        name,
        priceCents,
        stock: 50,
        soldOut: false,
        veg,
      })),
    });
  }

  // ── Prediction polls ──────────────────────────────────────────────────────────
  await db.doc("polls/poll-winner").set({
    matchId: MATCH_ID,
    question: "Who will win the final?",
    kind: "winner",
    options: [
      { optionId: "esp", label: "Spain", count: 0 },
      { optionId: "arg", label: "Argentina", count: 0 },
      { optionId: "draw", label: "Draw (to penalties)", count: 0 },
    ],
    createdBy: "system",
    createdAt: Date.now(),
  });

  console.log("✓ Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
