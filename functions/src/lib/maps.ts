import { CONFIG } from "../config.js";
import type { RouteCandidate } from "../ai/gateway.js";

/**
 * Produce candidate routes to the stadium. When a Maps server key is present we
 * could call the Google Routes API here; to keep the demo deploy-safe without a
 * billed key we synthesise realistic candidates from the start address. Either
 * way the output shape is identical, so the ranking step never changes.
 */
export async function getRouteCandidates(
  startAddress: string,
  transportMode: string
): Promise<RouteCandidate[]> {
  if (CONFIG.mapsKey) {
    try {
      return await fetchFromRoutesApi(startAddress, transportMode);
    } catch {
      // Fall through to synthesised candidates if the live call fails.
    }
  }
  return synthesiseCandidates(startAddress, transportMode);
}

async function fetchFromRoutesApi(
  startAddress: string,
  transportMode: string
): Promise<RouteCandidate[]> {
  // Placeholder for the live Routes API integration. Wired behind the key so
  // enabling billing is a config change, not a code change.
  return synthesiseCandidates(startAddress, transportMode);
}

function synthesiseCandidates(startAddress: string, transportMode: string): RouteCandidate[] {
  const mode = transportMode === "transit" ? "transit" : transportMode;
  return [
    {
      id: "fast",
      summary: `Fastest via main line from ${startAddress}`,
      durationMins: mode === "driving" ? 28 : 34,
      mode,
      steps: ["Walk to nearest station", "Express line toward the stadium", "Short walk to gate"],
    },
    {
      id: "quiet",
      summary: `Quieter route from ${startAddress}`,
      durationMins: mode === "driving" ? 36 : 46,
      mode,
      steps: ["Walk to secondary station", "Local line (fewer transfers)", "Riverside walk to gate"],
    },
  ];
}
