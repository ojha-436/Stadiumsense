/**
 * Gemini implementation of the AI gateway, via Vertex AI Express Mode
 * (`@google/genai`, `vertexai: true` + an API key instead of ADC).
 *
 * Model policy (see ARCHITECTURE.md ADR-4): every call currently uses
 * `gemini-2.5-flash` (CONFIG.flashModel / CONFIG.proModel both default to it);
 * the two config vars are kept separate so a future split back to a heavier
 * "pro" tier for reasoning-heavy calls (arrival planning, ops briefs) is a
 * one-line config change, not a code change.
 *
 * Every structured call constrains the model with responseSchema +
 * application/json so callers receive typed data, never free text to parse.
 * The API key is bound from Secret Manager via each function's `secrets`
 * option (see functions/src/index.ts) — it never reaches the client.
 */
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { CONFIG } from "../config.js";
import { sustainabilityPromptLine } from "../lib/sustainability.js";
import type { Lang, Match } from "../domain.js";
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

let client: GoogleGenAI | null = null;

/** Lazily construct the client so it always picks up the Secret Manager-bound
 *  API key at call time, not at module load (before the secret is injected). */
function ai(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey, vertexai: true });
  }
  return client;
}

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  es: "Spanish (Latin American)",
  fr: "French (Canadian)",
};

type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

/** Run a prompt with a forced JSON schema and parse the result into T. */
async function generateJson<T>(model: string, parts: Part[], schema: Schema): Promise<T> {
  const response = await ai().models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  const text = response.text ?? "{}";
  return JSON.parse(text) as T;
}

export class GeminiGateway implements AiGateway {
  async parseTicket(imageBase64: string, mimeType: string): Promise<TicketParseResult> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        matchId: { type: Type.STRING, nullable: true },
        section: { type: Type.STRING, nullable: true },
        row: { type: Type.STRING, nullable: true },
        seat: { type: Type.STRING, nullable: true },
        gate: { type: Type.STRING, nullable: true },
        confidence: { type: Type.NUMBER },
        raw: { type: Type.STRING },
      },
      required: ["confidence", "raw"],
    };
    return generateJson<TicketParseResult>(
      CONFIG.flashModel,
      [
        {
          text: "Extract the FIFA World Cup 2026 ticket fields from this image. Return section, row, seat, entry gate, and any match identifier you can read. Set confidence 0-1 for how clearly you could read it. Put the full readable text in raw.",
        },
        { inlineData: { data: imageBase64, mimeType } },
      ],
      schema
    );
  }

  async planArrival(input: ArrivalPlanInput): Promise<ArrivalPlanResult> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        leaveByIso: { type: Type.STRING },
        arriveByIso: { type: Type.STRING },
        recommendedGate: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["leaveByIso", "arriveByIso", "recommendedGate", "reasoning", "assumptions"],
    };
    const kickoffIso = new Date(input.match.kickoff).toISOString();
    const prompt = `You are a stadium arrival planner for the FIFA World Cup 2026 at ${input.match.venueName}, ${input.match.city}.
Kick-off (ISO): ${kickoffIso}.
Fan seat section: ${input.section}${input.gate ? `, printed gate ${input.gate}` : ""}.
Travelling from: ${input.startArea ?? "unknown"} by ${input.transportMode}.
Accessibility needs: ${input.accessibilityNeeds.join(", ") || "none"}.
Recommend when to leave and arrive, and the best entry gate for their section, accounting for security queues that peak 60-90 minutes before kick-off and giving extra buffer if accessibility needs are present.
${sustainabilityPromptLine(input.transportMode)}
Write reasoning and assumptions in ${LANG_NAME[input.lang]}. Return ISO 8601 timestamps.`;
    return generateJson<ArrivalPlanResult>(CONFIG.proModel, [{ text: prompt }], schema);
  }

  async rankRoutes(input: RouteRankInput): Promise<RankedRoute[]> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        routes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              summary: { type: Type.STRING },
              durationMins: { type: Type.NUMBER },
              mode: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              crowdLevel: { type: Type.STRING, enum: ["low", "medium", "high"], format: "enum" },
              recommendation: { type: Type.STRING },
            },
            required: ["id", "summary", "durationMins", "mode", "steps", "crowdLevel", "recommendation"],
          },
        },
      },
      required: ["routes"],
    };
    const prompt = `Rank these candidate routes to the stadium by a balance of travel time and crowding.
Current transit line loads: ${JSON.stringify(input.transitLines.map((l) => ({ name: l.name, loadPct: l.loadPct })))}.
Candidates: ${JSON.stringify(input.candidates)}.
Assign each a crowdLevel (low/medium/high) and a one-sentence recommendation in ${LANG_NAME[input.lang]} explaining the time-vs-crowd trade-off. Preserve each route id.`;
    const out = await generateJson<{ routes: RankedRoute[] }>(
      CONFIG.flashModel,
      [{ text: prompt }],
      schema
    );
    return out.routes;
  }

  async matchContent(match: Match, lang: Lang): Promise<MatchContentResult> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        preview: { type: Type.STRING },
        facts: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["preview", "facts"],
    };
    const prompt = `Write an engaging matchday preview and 4 short interesting facts for this FIFA World Cup 2026 fixture, in ${LANG_NAME[lang]}.
${match.home.teamName} (${match.home.formation}) vs ${match.away.teamName} (${match.away.formation}), ${match.stage}, at ${match.venueName}, ${match.city}.
Keep the preview under 60 words and each fact under 20 words. Be factual and upbeat; do not invent specific statistics or scores.`;
    return generateJson<MatchContentResult>(CONFIG.flashModel, [{ text: prompt }], schema);
  }

  async opsBrief(snapshot: OpsSnapshot, lang: Lang): Promise<OpsBriefResult> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        actions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"], format: "enum" },
            },
            required: ["title", "detail", "priority"],
          },
        },
      },
      required: ["summary", "actions"],
    };
    const prompt = `You are the operations analyst for a FIFA World Cup 2026 stadium. Given this live snapshot, write a concise situation summary and 0-3 concrete recommended actions for the ops room, in ${LANG_NAME[lang]}.
Minutes to kick-off: ${snapshot.minutesToKickoff}.
Zones: ${JSON.stringify(snapshot.zones.map((z) => ({ name: z.name, densityPct: Math.round(z.densityPct), trend: z.trend })))}.
Gates: ${JSON.stringify(snapshot.gates.map((g) => ({ label: g.label, queueMins: g.queueMins, status: g.status })))}.
Transit: ${JSON.stringify(snapshot.transit.map((t) => ({ name: t.name, loadPct: t.loadPct })))}.
Open incidents: ${JSON.stringify(snapshot.incidents.filter((i) => i.status === "open"))}.
Reference specific zone names and numbers. Only recommend actions that the data justifies.`;
    return generateJson<OpsBriefResult>(CONFIG.proModel, [{ text: prompt }], schema);
  }

  async moderatePost(caption: string, imageBase64?: string): Promise<ModerationResult> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        allowed: { type: Type.BOOLEAN },
        altText: { type: Type.STRING },
        reason: { type: Type.STRING, nullable: true },
      },
      required: ["allowed", "altText"],
    };
    const parts: Part[] = [
      {
        text: `Moderate this fan social post for a family-friendly FIFA World Cup 2026 wall. Reject hate speech, harassment, or explicit content. Also write concise descriptive alt text for the image (for screen-reader accessibility). Caption: "${caption}".`,
      },
    ];
    if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: "image/jpeg" } });
    return generateJson<ModerationResult>(CONFIG.flashModel, parts, schema);
  }

  async opsChat(
    question: string,
    history: OpsChatTurn[],
    context: OpsChatContext,
    lang: Lang
  ): Promise<OpsChatResult> {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING },
        sources: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["answer", "sources"],
    };
    const priorTurns = history
      .slice(-4)
      .map((h) => `${h.role}: ${h.content}`)
      .join("\n");
    const prompt = `You are the operations assistant for a FIFA World Cup 2026 stadium. Answer the operator's question STRICTLY from the fan-supplied data below — never invent numbers. If the data can't answer it, say so. Reply in ${LANG_NAME[lang]} and list which data signals you used in "sources".

FAN DATA (aggregated from fan check-ins):
${JSON.stringify(context)}

${priorTurns ? `Conversation so far:\n${priorTurns}\n` : ""}Operator question: ${question}`;
    return generateJson<OpsChatResult>(CONFIG.flashModel, [{ text: prompt }], schema);
  }
}
