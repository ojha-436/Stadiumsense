/**
 * Request/response contracts for the Cloud Functions callable API.
 * Keeping these beside the domain model means the client and the functions
 * agree on payload shapes at compile time.
 */
import type {
  AccessibilityNeed,
  Lang,
  MatchContent,
  OpsAction,
  SeatLocation,
  TransportMode,
} from "./domain";

// parseTicket -----------------------------------------------------------------
export interface ParseTicketRequest {
  /** Storage path of the uploaded ticket image (tickets/{uid}/{file}). */
  imagePath: string;
}
export interface ParseTicketResponse {
  matchId: string | null;
  seat: Partial<SeatLocation>;
  /** Model confidence 0–1; the UI asks the fan to confirm below a threshold. */
  confidence: number;
  raw: string;
}

// planArrival -----------------------------------------------------------------
export interface PlanArrivalRequest {
  matchId: string;
  section: string;
  gate?: string;
  startArea?: string;
  transportMode: TransportMode;
  accessibilityNeeds: AccessibilityNeed[];
  lang: Lang;
}
export interface PlanArrivalResponse {
  leaveByIso: string;
  arriveByIso: string;
  recommendedGate: string;
  reasoning: string;
  assumptions: string[];
  cached: boolean;
}

// planRoute -------------------------------------------------------------------
export interface RouteOption {
  id: string;
  summary: string;
  durationMins: number;
  mode: TransportMode;
  crowdLevel: "low" | "medium" | "high";
  steps: string[];
  recommendation: string;
}
export interface PlanRouteRequest {
  matchId: string;
  startAddress: string;
  transportMode: TransportMode;
  lang: Lang;
}
export interface PlanRouteResponse {
  options: RouteOption[];
  bestOptionId: string;
}

// getMatchContent -------------------------------------------------------------
export interface GetMatchContentRequest {
  matchId: string;
  lang: Lang;
}
export type GetMatchContentResponse = MatchContent;

// opsBrief --------------------------------------------------------------------
export interface OpsBriefRequest {
  matchId: string;
  lang: Lang;
}
export interface OpsBriefResponse {
  summary: string;
  actions: OpsAction[];
  createdAt: number;
}

// provisionUser (admin) -------------------------------------------------------
export interface ProvisionUserRequest {
  email: string;
  displayName: string;
  role: "vendor" | "ops" | "admin";
  stallId?: string;
}
export interface ProvisionUserResponse {
  uid: string;
  tempPassword: string;
}

export interface DeactivateUserRequest {
  uid: string;
  active: boolean;
}

// opsChat — fan-data-grounded assistant for the operator dashboard -----------
export interface OpsChatMessage {
  role: "user" | "assistant";
  content: string;
}
export interface OpsChatRequest {
  matchId: string;
  question: string;
  /** Prior turns for short conversational context. */
  history: OpsChatMessage[];
  lang: Lang;
}
export interface OpsChatResponse {
  answer: string;
  /** Short labels for the fan-data signals the answer drew on (for transparency). */
  sources: string[];
}

// approveAccessRequest (admin) ------------------------------------------------
export interface ApproveAccessRequest {
  requestId: string;
  approve: boolean;
}
export interface ApproveAccessResponse {
  uid: string;
  role: string;
  status: string;
}
