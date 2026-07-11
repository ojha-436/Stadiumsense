/**
 * Typed client wrappers over the Cloud Functions callable API. Each wrapper
 * pins the request/response contract so a mismatch is a compile error, and the
 * UI never constructs raw callable payloads inline.
 */
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { DEMO } from "./demo/flag";
import { demoApi } from "./demo/gateway";
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

function callable<Req, Res>(name: string) {
  const fn = httpsCallable<Req, Res>(functions, name);
  return async (data: Req): Promise<Res> => (await fn(data)).data;
}

const realApi = {
  parseTicket: callable<ParseTicketRequest, ParseTicketResponse>("parseTicket"),
  planArrival: callable<PlanArrivalRequest, PlanArrivalResponse>("planArrival"),
  planRoute: callable<PlanRouteRequest, PlanRouteResponse>("planRoute"),
  getMatchContent: callable<GetMatchContentRequest, GetMatchContentResponse>("getMatchContent"),
  opsBrief: callable<OpsBriefRequest, OpsBriefResponse>("opsBrief"),
  provisionUser: callable<ProvisionUserRequest, ProvisionUserResponse>("provisionUser"),
  setUserActive: callable<DeactivateUserRequest, { uid: string; active: boolean }>("setUserActive"),
  approveAccessRequest: callable<ApproveAccessRequest, ApproveAccessResponse>("approveAccessRequest"),
  opsChat: callable<OpsChatRequest, OpsChatResponse>("opsChat"),
};

// In demo mode the Gemini/callable API is served entirely client-side.
export const api = DEMO ? demoApi : realApi;
