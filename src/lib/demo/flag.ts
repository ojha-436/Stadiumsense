/**
 * Demo mode. When VITE_DEMO=true the app runs fully in the browser against an
 * in-memory store + a client port of the Gemini fake gateway — no Firebase
 * backend, no Java emulator, no cloud billing. Used for offline local previews.
 *
 * This flag is a build-time constant, so the hook/module swaps it drives are
 * resolved once and never change across renders (Rules of Hooks stay satisfied).
 */
export const DEMO = import.meta.env.VITE_DEMO === "true";
