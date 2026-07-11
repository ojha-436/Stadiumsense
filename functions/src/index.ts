/**
 * StadiumSense Cloud Functions entry point.
 *
 * All callables enforce App Check and validate their inputs; role-restricted
 * ones additionally check the caller's custom claim. This is the only tier that
 * talks to Gemini/Maps, so no third-party key ever reaches the browser.
 *
 * The Gemini API key is bound from Secret Manager (never hardcoded) via the
 * `secrets: [GEMINI_API_KEY]` option on each individual function that uses the
 * AI gateway — a global `secrets` entry in `setGlobalOptions` does NOT reliably
 * bind secrets to 2nd-gen functions, so each call site declares it explicitly
 * (see functions/src/lib/secrets.ts).
 */
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

export { parseTicket } from "./callable/parseTicket.js";
export { planArrival } from "./callable/planArrival.js";
export { planRoute } from "./callable/planRoute.js";
export { getMatchContent } from "./callable/getMatchContent.js";
export { opsBrief } from "./callable/opsBrief.js";
export { opsChat } from "./callable/opsChat.js";
export { provisionUser, setUserActive } from "./callable/provisionUser.js";
export { approveAccessRequest } from "./callable/approveAccessRequest.js";
export { onOrderCreated } from "./triggers/onOrderCreated.js";
export { onPostCreated } from "./triggers/onPostCreated.js";
export { onVoteCreated } from "./triggers/onVoteCreated.js";
