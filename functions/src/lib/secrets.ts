import { defineSecret } from "firebase-functions/params";

/**
 * The Gemini API key (Vertex AI Express Mode), stored in Secret Manager.
 * Must be listed in the `secrets` option of every function that constructs
 * the AI gateway — a global `secrets` entry in `setGlobalOptions` does NOT
 * reliably bind secrets to individual 2nd-gen functions, so this is imported
 * and declared explicitly per function instead.
 */
export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
