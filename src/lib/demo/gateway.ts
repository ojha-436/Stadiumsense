/**
 * Client port of the Cloud Functions fake AI gateway (functions/src/ai/fake.ts),
 * wired to the demo store. Returns the exact shapes the real callable API
 * returns, so the UI components are identical in demo and production.
 */
import type {
  ApproveAccessRequest,
  ApproveAccessResponse,
  GetMatchContentRequest,
  GetMatchContentResponse,
  OpsBriefRequest,
  OpsBriefResponse,
  OpsChatRequest,
  OpsChatResponse,
  ParseTicketRequest,
  ParseTicketResponse,
  PlanArrivalRequest,
  PlanArrivalResponse,
  PlanRouteRequest,
  PlanRouteResponse,
  ProvisionUserRequest,
  ProvisionUserResponse,
  DeactivateUserRequest,
} from "@/types/contracts";
import type { FanProfile, Incident, Lang, Match, Order, TransitLine, Zone } from "@/types/domain";
import { mapFanProfile, mapIncident, mapMatch, mapOrder, mapTransitLine, mapZone } from "@/lib/mappers";
import { demoStore } from "./store";
import { demoAuth } from "./auth";
import { DEMO_MATCH_ID } from "./data";
import { answerFromFanData } from "./opsChat";

const pick = <T,>(lang: Lang, m: Record<Lang, T>): T => m[lang] ?? m.en;
const delay = <T,>(value: T, ms = 550): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

function getMatch(matchId: string): Match | null {
  const doc = demoStore.get("matches", matchId);
  return doc ? mapMatch(doc.id, doc.data) : null;
}
function sectionToGate(section: string): string {
  const n = parseInt(section, 10);
  return Number.isNaN(n) ? "A" : (["A", "B", "C", "D"][Math.floor((n / 100) % 4)] ?? "A");
}

export const demoApi = {
  async parseTicket(_req: ParseTicketRequest): Promise<ParseTicketResponse> {
    return delay({
      matchId: DEMO_MATCH_ID,
      seat: { section: "114", row: "R", seat: "7", gate: "C" },
      confidence: 0.92,
      raw: "FIFA WORLD CUP 2026 — FINAL — SEC 114 ROW R SEAT 7 — GATE C",
    });
  },

  async planArrival(req: PlanArrivalRequest): Promise<PlanArrivalResponse> {
    const match = getMatch(req.matchId);
    const kickoff = match?.kickoff ?? Date.now() + 2 * 3600_000;
    const buffer = req.accessibilityNeeds.length > 0 ? 75 : 55;
    const travelPad = req.transportMode === "transit" ? 50 : 35;
    const arriveBy = kickoff - buffer * 60000;
    const leaveBy = arriveBy - travelPad * 60000;
    const gate = req.gate || sectionToGate(req.section);
    return delay({
      leaveByIso: new Date(leaveBy).toISOString(),
      arriveByIso: new Date(arriveBy).toISOString(),
      recommendedGate: gate,
      reasoning: pick(req.lang, {
        en: `Gate ${gate} is closest to section ${req.section} and clears fastest 60–90 minutes before kick-off. Leaving then avoids the heaviest security queues.`,
        es: `La Puerta ${gate} es la más cercana a la sección ${req.section} y se despeja más rápido entre 60 y 90 minutos antes del inicio. Salir a esa hora evita las filas de seguridad más largas.`,
        fr: `La Porte ${gate} est la plus proche de la section ${req.section} et se dégage le plus vite 60 à 90 minutes avant le coup d'envoi. Partir à ce moment évite les files de sécurité les plus longues.`,
      }),
      assumptions: [
        pick(req.lang, {
          en: "Expected gate congestion 60–90 min before kick-off",
          es: "Congestión de puertas esperada 60–90 min antes del inicio",
          fr: "Affluence attendue aux portes 60–90 min avant le coup d'envoi",
        }),
        pick(req.lang, {
          en: `Travel by ${req.transportMode}`,
          es: `Viaje en ${req.transportMode}`,
          fr: `Trajet en ${req.transportMode}`,
        }),
      ],
      cached: false,
    });
  },

  async planRoute(req: PlanRouteRequest): Promise<PlanRouteResponse> {
    const transit = demoStore
      .list("transitLines")
      .map((d) => mapTransitLine(d.id, d.data) as TransitLine);
    const avgLoad = transit.length
      ? transit.reduce((s, l) => s + l.loadPct, 0) / transit.length
      : 50;
    const options = [
      {
        id: "fast",
        summary: pick(req.lang, {
          en: `Fastest via main line from ${req.startAddress}`,
          es: `La más rápida por la línea principal desde ${req.startAddress}`,
          fr: `La plus rapide via la ligne principale depuis ${req.startAddress}`,
        }),
        durationMins: req.transportMode === "driving" ? 28 : 34,
        mode: req.transportMode,
        crowdLevel: (avgLoad > 60 ? "high" : "medium") as "low" | "medium" | "high",
        steps: ["Walk to nearest station", "Express line toward the stadium", "Short walk to gate"],
        recommendation: pick(req.lang, {
          en: "Fastest by time, but expect crowds near kick-off.",
          es: "La más rápida, pero espera multitudes cerca del inicio.",
          fr: "La plus rapide, mais attendez-vous à de l'affluence près du coup d'envoi.",
        }),
      },
      {
        id: "quiet",
        summary: pick(req.lang, {
          en: `Quieter route from ${req.startAddress}`,
          es: `Ruta más tranquila desde ${req.startAddress}`,
          fr: `Itinéraire plus calme depuis ${req.startAddress}`,
        }),
        durationMins: req.transportMode === "driving" ? 36 : 46,
        mode: req.transportMode,
        crowdLevel: "low" as const,
        steps: ["Walk to secondary station", "Local line (fewer transfers)", "Riverside walk to gate"],
        recommendation: pick(req.lang, {
          en: "A few minutes longer but far less crowded.",
          es: "Unos minutos más pero mucho menos concurrida.",
          fr: "Quelques minutes de plus mais bien moins fréquentée.",
        }),
      },
    ];
    return delay({ options, bestOptionId: "quiet" });
  },

  async getMatchContent(req: GetMatchContentRequest): Promise<GetMatchContentResponse> {
    const match = getMatch(req.matchId);
    const h = match?.home.teamName ?? "Home";
    const a = match?.away.teamName ?? "Away";
    const venue = match?.venueName ?? "the stadium";
    return delay({
      lang: req.lang,
      preview: pick(req.lang, {
        en: `${h} meet ${a} in the final at ${venue}. Both sides arrive in form for what promises to be a defining night of the tournament.`,
        es: `${h} se enfrenta a ${a} en la final en ${venue}. Ambos llegan en forma para lo que promete ser una noche decisiva del torneo.`,
        fr: `${h} affronte ${a} en finale au ${venue}. Les deux équipes arrivent en forme pour ce qui s'annonce comme une soirée décisive.`,
      }),
      facts: [
        pick(req.lang, {
          en: `${h} favour possession; ${a} threaten on the counter.`,
          es: `${h} prefiere la posesión; ${a} amenaza al contragolpe.`,
          fr: `${h} privilégie la possession ; ${a} menace en contre.`,
        }),
        pick(req.lang, {
          en: "FIFA World Cup 2026 is the first hosted across three nations.",
          es: "La Copa Mundial de la FIFA 2026 es la primera organizada en tres naciones.",
          fr: "La Coupe du Monde 2026 est la première organisée par trois nations.",
        }),
        pick(req.lang, {
          en: "It is also the first 48-team World Cup finals.",
          es: "También es la primera fase final con 48 selecciones.",
          fr: "C'est aussi la première phase finale à 48 équipes.",
        }),
      ],
      generatedAt: Date.now(),
    });
  },

  async opsBrief(req: OpsBriefRequest): Promise<OpsBriefResponse> {
    const zones = demoStore.list("zones").map((d) => mapZone(d.id, d.data) as Zone);
    const hot = [...zones].sort((a, b) => b.densityPct - a.densityPct)[0];
    const summary = hot
      ? pick(req.lang, {
          en: `${hot.name} is at ${Math.round(hot.densityPct)}% density and ${hot.trend}. Monitor closely as kick-off approaches.`,
          es: `${hot.name} está al ${Math.round(hot.densityPct)}% de densidad y ${hot.trend}. Vigilar de cerca al acercarse el inicio.`,
          fr: `${hot.name} est à ${Math.round(hot.densityPct)}% de densité et ${hot.trend}. À surveiller de près à l'approche du coup d'envoi.`,
        })
      : pick(req.lang, { en: "All zones nominal.", es: "Todas las zonas normales.", fr: "Toutes les zones nominales." });
    const actions =
      hot && hot.densityPct > 65
        ? [
            {
              title: pick(req.lang, { en: `Relieve ${hot.name}`, es: `Aliviar ${hot.name}`, fr: `Désengorger ${hot.name}` }),
              detail: pick(req.lang, {
                en: `Open an additional gate and redirect arriving fans away from ${hot.name}.`,
                es: `Abrir una puerta adicional y redirigir a los aficionados lejos de ${hot.name}.`,
                fr: `Ouvrir une porte supplémentaire et rediriger les supporters loin de ${hot.name}.`,
              }),
              priority: "high" as const,
            },
          ]
        : [];
    return delay({ summary, actions, createdAt: Date.now() });
  },

  async provisionUser(req: ProvisionUserRequest): Promise<ProvisionUserResponse> {
    const uid = demoStore.add("users", {
      role: req.role,
      displayName: req.displayName,
      email: req.email,
      lang: "en",
      active: true,
      ...(req.stallId ? { stallId: req.stallId } : {}),
      createdAt: Date.now(),
    });
    return delay({ uid, tempPassword: "demo-temp-pass" }, 300);
  },

  async setUserActive(req: DeactivateUserRequest): Promise<{ uid: string; active: boolean }> {
    demoStore.update("users", req.uid, { active: req.active });
    return delay({ uid: req.uid, active: req.active }, 200);
  },

  async approveAccessRequest(req: ApproveAccessRequest): Promise<ApproveAccessResponse> {
    const request = demoStore.get("accessRequests", req.requestId);
    const role = (request?.data.requestedRole as string) ?? "ops";
    const uid = (request?.data.uid as string) ?? "";
    demoAuth.decide(req.requestId, req.approve);
    return delay(
      { uid, role: req.approve ? role : "fan", status: req.approve ? "active" : "rejected" },
      200
    );
  },

  async opsChat(req: OpsChatRequest): Promise<OpsChatResponse> {
    const fans = demoStore
      .list("fanProfiles")
      .map((d) => mapFanProfile(d.id, d.data) as FanProfile);
    const orders = demoStore.list("orders").map((d) => mapOrder(d.id, d.data) as Order);
    const incidents = demoStore
      .list("incidents")
      .map((d) => mapIncident(d.id, d.data) as Incident)
      .filter((i) => i.source === "fan");
    return delay(answerFromFanData(req.question, req.lang, { fans, orders, incidents }), 650);
  },
};
