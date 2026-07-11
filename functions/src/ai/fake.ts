/**
 * Deterministic, offline implementation of the AI gateway. It produces
 * plausible, input-derived output with zero external calls, so:
 *   - unit/integration tests are fast and never flaky, and
 *   - the live demo has a guaranteed fallback if Vertex AI is unreachable or
 *     out of quota during judging (set AI_BACKEND=fake).
 * It is intentionally NOT random — the same input always yields the same output.
 */
import type {
  AiGateway,
  ArrivalPlanInput,
  ArrivalPlanResult,
  MatchContentResult,
  ModerationResult,
  OpsBriefResult,
  OpsChatContext,
  OpsChatResult,
  OpsChatTurn,
  OpsSnapshot,
  RankedRoute,
  RouteRankInput,
  TicketParseResult,
} from "./gateway.js";
import type { Lang, Match } from "../domain.js";

const BLOCKLIST = ["slur1", "slur2", "hateword"]; // illustrative only

export class FakeGateway implements AiGateway {
  async parseTicket(_imageBase64: string, _mimeType: string): Promise<TicketParseResult> {
    return {
      matchId: "demo-final",
      section: "114",
      row: "R",
      seat: "7",
      gate: "C",
      confidence: 0.92,
      raw: "FIFA WORLD CUP 2026 — FINAL — SEC 114 ROW R SEAT 7 — GATE C",
    };
  }

  async planArrival(input: ArrivalPlanInput): Promise<ArrivalPlanResult> {
    const kickoff = input.match.kickoff;
    // Fans with step-free / wheelchair needs get a larger buffer.
    const needsBuffer = input.accessibilityNeeds.length > 0;
    const arriveLead = needsBuffer ? 75 : 55;
    const travelPad = input.transportMode === "transit" ? 50 : 35;
    const arriveBy = kickoff - arriveLead * 60000;
    const leaveBy = arriveBy - travelPad * 60000;
    const gate = input.gate ?? sectionToGate(input.section);
    return {
      leaveByIso: new Date(leaveBy).toISOString(),
      arriveByIso: new Date(arriveBy).toISOString(),
      recommendedGate: gate,
      reasoning: localised(input.lang, {
        en: `Gate ${gate} is closest to section ${input.section} and clears fastest 60–90 minutes before kick-off. Leaving then avoids the heaviest security queues.`,
        es: `La Puerta ${gate} es la más cercana a la sección ${input.section} y se despeja más rápido entre 60 y 90 minutos antes del inicio. Salir a esa hora evita las filas de seguridad más largas.`,
        fr: `La Porte ${gate} est la plus proche de la section ${input.section} et se dégage le plus vite 60 à 90 minutes avant le coup d'envoi. Partir à ce moment évite les files de sécurité les plus longues.`,
      }),
      assumptions: [
        localised(input.lang, {
          en: "Expected gate congestion 60–90 min before kick-off",
          es: "Congestión de puertas esperada 60–90 min antes del inicio",
          fr: "Affluence attendue aux portes 60–90 min avant le coup d'envoi",
        }),
        localised(input.lang, {
          en: `Travel by ${input.transportMode}`,
          es: `Viaje en ${input.transportMode}`,
          fr: `Trajet en ${input.transportMode}`,
        }),
      ],
    };
  }

  async rankRoutes(input: RouteRankInput): Promise<RankedRoute[]> {
    const avgLoad =
      input.transitLines.length > 0
        ? input.transitLines.reduce((s, l) => s + l.loadPct, 0) / input.transitLines.length
        : 40;
    return input.candidates.map((c, i) => {
      const crowdLevel = i === 0 && avgLoad > 60 ? "high" : i === 0 ? "medium" : "low";
      return {
        ...c,
        crowdLevel,
        recommendation:
          crowdLevel === "low"
            ? localised(input.lang, {
                en: "Quieter option — a few minutes longer but far less crowded.",
                es: "Opción más tranquila — unos minutos más pero mucho menos concurrida.",
                fr: "Option plus calme — quelques minutes de plus mais bien moins fréquentée.",
              })
            : localised(input.lang, {
                en: "Fastest by time, but expect crowds near kick-off.",
                es: "La más rápida, pero espera multitudes cerca del inicio.",
                fr: "La plus rapide, mais attendez-vous à de l'affluence près du coup d'envoi.",
              }),
      };
    });
  }

  async matchContent(match: Match, lang: Lang): Promise<MatchContentResult> {
    const h = match.home.teamName;
    const a = match.away.teamName;
    return {
      preview: localised(lang, {
        en: `${h} meet ${a} in the ${match.stage} at ${match.venueName}. Both sides arrive in form for what promises to be a defining night of the tournament.`,
        es: `${h} se enfrenta a ${a} en ${match.stage} en ${match.venueName}. Ambos llegan en forma para lo que promete ser una noche decisiva del torneo.`,
        fr: `${h} affronte ${a} en ${match.stage} au ${match.venueName}. Les deux équipes arrivent en forme pour ce qui s'annonce comme une soirée décisive du tournoi.`,
      }),
      facts: [
        localised(lang, {
          en: `${h} line up in a ${match.home.formation}; ${a} counter with a ${match.away.formation}.`,
          es: `${h} forma en ${match.home.formation}; ${a} responde con ${match.away.formation}.`,
          fr: `${h} s'aligne en ${match.home.formation} ; ${a} répond en ${match.away.formation}.`,
        }),
        localised(lang, {
          en: `Kick-off is at ${match.venueName}, ${match.city}.`,
          es: `El inicio es en ${match.venueName}, ${match.city}.`,
          fr: `Le coup d'envoi a lieu au ${match.venueName}, ${match.city}.`,
        }),
        localised(lang, {
          en: "FIFA World Cup 2026 is the first hosted across three nations.",
          es: "La Copa Mundial de la FIFA 2026 es la primera organizada en tres naciones.",
          fr: "La Coupe du Monde 2026 est la première organisée par trois nations.",
        }),
      ],
    };
  }

  async opsBrief(snapshot: OpsSnapshot, lang: Lang): Promise<OpsBriefResult> {
    const hot = [...snapshot.zones].sort((a, b) => b.densityPct - a.densityPct)[0];
    const openIncidents = snapshot.incidents.filter((i) => i.status === "open").length;
    const summary = hot
      ? localised(lang, {
          en: `${hot.name} is at ${Math.round(hot.densityPct)}% density and ${hot.trend}. ${openIncidents} open incident(s). Kick-off in ${snapshot.minutesToKickoff} min.`,
          es: `${hot.name} está al ${Math.round(hot.densityPct)}% de densidad y ${hot.trend}. ${openIncidents} incidente(s) abierto(s). Inicio en ${snapshot.minutesToKickoff} min.`,
          fr: `${hot.name} est à ${Math.round(hot.densityPct)}% de densité et ${hot.trend}. ${openIncidents} incident(s) ouvert(s). Coup d'envoi dans ${snapshot.minutesToKickoff} min.`,
        })
      : localised(lang, { en: "All zones nominal.", es: "Todas las zonas normales.", fr: "Toutes les zones nominales." });
    const actions =
      hot && hot.densityPct > 70
        ? [
            {
              title: localised(lang, {
                en: `Relieve ${hot.name}`,
                es: `Aliviar ${hot.name}`,
                fr: `Désengorger ${hot.name}`,
              }),
              detail: localised(lang, {
                en: `Open an additional gate and redirect arriving fans away from ${hot.name}.`,
                es: `Abrir una puerta adicional y redirigir a los aficionados lejos de ${hot.name}.`,
                fr: `Ouvrir une porte supplémentaire et rediriger les supporters loin de ${hot.name}.`,
              }),
              priority: "high" as const,
            },
          ]
        : [];
    return { summary, actions };
  }

  async moderatePost(caption: string, _imageBase64?: string): Promise<ModerationResult> {
    const lower = caption.toLowerCase();
    const bad = BLOCKLIST.some((w) => lower.includes(w));
    return {
      allowed: !bad,
      altText: bad ? "" : `Fan post: ${caption.slice(0, 80)}`,
      reason: bad ? "Contains disallowed language" : undefined,
    };
  }

  async opsChat(
    question: string,
    _history: OpsChatTurn[],
    ctx: OpsChatContext,
    _lang: Lang
  ): Promise<OpsChatResult> {
    const q = question.toLowerCase();
    if (/access|wheelchair|step|disab|sensory|hearing|vision/.test(q)) {
      const list = ctx.accessibility.map((a) => `${a.need} (${a.count})`).join(", ") || "none";
      const total = ctx.accessibility.reduce((s, a) => s + a.count, 0);
      return {
        answer: `${total} of ${ctx.totalFans} fans reported accessibility needs: ${list}. Position step-free routing and staff near their sections.`,
        sources: ["fan profiles", "accessibility needs"],
      };
    }
    if (/transport|transit|arriv|travel|metro|bus|driv/.test(q)) {
      const list = ctx.transport.map((tm) => `${tm.mode} (${tm.count})`).join(", ") || "no data";
      return { answer: `Fan travel modes: ${list}.`, sources: ["fan profiles", "transport mode"] };
    }
    if (/section|where|seat|crowd|zone/.test(q)) {
      const list = ctx.sections.slice(0, 4).map((s) => `Sec ${s.section}: ${s.count}`).join(", ");
      return { answer: `Busiest sections — ${list}.`, sources: ["fan profiles", "seat sections"] };
    }
    if (/food|order|revenue/.test(q)) {
      return {
        answer: `${ctx.orders.count} seat orders totalling $${(ctx.orders.revenueCents / 100).toFixed(2)}.`,
        sources: ["fan orders"],
      };
    }
    if (/incident|issue|report|problem/.test(q)) {
      const list = ctx.fanIncidents.map((i) => `${i.type} @ ${i.zone}`).join("; ") || "none";
      return { answer: `${ctx.fanIncidents.length} fan-reported incident(s): ${list}.`, sources: ["fan-reported incidents"] };
    }
    return {
      answer: `${ctx.totalFans} fans checked in (${ctx.partygoers} incl. groups). Ask about accessibility, transport, orders, or incidents.`,
      sources: ["fan profiles"],
    };
  }
}

function sectionToGate(section: string): string {
  const n = parseInt(section, 10);
  if (Number.isNaN(n)) return "A";
  return ["A", "B", "C", "D"][Math.floor((n / 100) % 4)] ?? "A";
}

function localised(lang: Lang, map: Record<Lang, string>): string {
  return map[lang] ?? map.en;
}
