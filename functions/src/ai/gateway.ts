/**
 * The AI gateway interface. Every Gemini interaction in the system flows
 * through this one contract, which gives us three things:
 *   1. A single seam to swap the real Vertex AI backend for a deterministic
 *      fake in tests and in a no-billing demo fallback.
 *   2. Prompt/response shapes that are typed, so callers never parse raw text.
 *   3. One audited place where model choice (Flash vs Pro) is decided.
 */
import type {
  Gate,
  Incident,
  Lang,
  Match,
  OpsAction,
  TransitLine,
  Zone,
} from "../domain.js";

export interface TicketParseResult {
  matchId: string | null;
  section: string | null;
  row: string | null;
  seat: string | null;
  gate: string | null;
  confidence: number;
  raw: string;
}

export interface ArrivalPlanInput {
  match: Match;
  section: string;
  gate?: string;
  startArea?: string;
  transportMode: string;
  accessibilityNeeds: string[];
  lang: Lang;
}
export interface ArrivalPlanResult {
  leaveByIso: string;
  arriveByIso: string;
  recommendedGate: string;
  reasoning: string;
  assumptions: string[];
}

export interface RouteCandidate {
  id: string;
  summary: string;
  durationMins: number;
  mode: string;
  steps: string[];
}
export interface RankedRoute extends RouteCandidate {
  crowdLevel: "low" | "medium" | "high";
  recommendation: string;
}
export interface RouteRankInput {
  candidates: RouteCandidate[];
  transitLines: TransitLine[];
  lang: Lang;
}

export interface MatchContentResult {
  preview: string;
  facts: string[];
}

export interface OpsSnapshot {
  zones: Zone[];
  gates: Gate[];
  transit: TransitLine[];
  incidents: Incident[];
  minutesToKickoff: number;
}
export interface OpsBriefResult {
  summary: string;
  actions: OpsAction[];
}

export interface ModerationResult {
  allowed: boolean;
  altText: string;
  reason?: string;
}

/** Aggregated fan-supplied signals the operator assistant is grounded on. */
export interface OpsChatContext {
  totalFans: number;
  partygoers: number;
  sections: Array<{ section: string; count: number }>;
  transport: Array<{ mode: string; count: number }>;
  accessibility: Array<{ need: string; count: number }>;
  orders: { count: number; revenueCents: number };
  fanIncidents: Array<{ type: string; zone: string; severity: string }>;
}
export interface OpsChatTurn {
  role: "user" | "assistant";
  content: string;
}
export interface OpsChatResult {
  answer: string;
  sources: string[];
}

export interface AiGateway {
  parseTicket(imageBase64: string, mimeType: string): Promise<TicketParseResult>;
  planArrival(input: ArrivalPlanInput): Promise<ArrivalPlanResult>;
  rankRoutes(input: RouteRankInput): Promise<RankedRoute[]>;
  matchContent(match: Match, lang: Lang): Promise<MatchContentResult>;
  opsBrief(snapshot: OpsSnapshot, lang: Lang): Promise<OpsBriefResult>;
  moderatePost(caption: string, imageBase64?: string): Promise<ModerationResult>;
  opsChat(
    question: string,
    history: OpsChatTurn[],
    context: OpsChatContext,
    lang: Lang
  ): Promise<OpsChatResult>;
}
