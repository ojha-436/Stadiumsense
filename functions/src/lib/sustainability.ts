const CAR_KG_PER_KM: number = 0.192;
const TRANSIT_KG_PER_KM: number = 0.041;
const WALKING_KG_PER_KM: number = 0;

const DEFAULT_DISTANCE_KM: number = 15;

/**
 * Calculates the kg of CO2 saved by choosing a specific transport mode versus driving the same distance.
 * @param transportMode The mode of transport ("transit", "walking", etc.).
 * @param tripDistanceKm Optional distance in kilometers. Defaults to 15 km if not provided.
 * @returns The saved CO2 amount as a number, or null if no saving is calculated (e.g., driving).
 */
export function co2SavedVsDrivingKg(
  transportMode: string,
  tripDistanceKm?: number
): number | null {
  const distance = tripDistanceKm ?? DEFAULT_DISTANCE_KM;

  if (transportMode === "transit") {
    // (0.192 - 0.041) * distance
    return (CAR_KG_PER_KM - TRANSIT_KG_PER_KM) * distance;
  }

  if (transportMode === "walking") {
    // Walking emits nothing, so the saving is the full car footprint per km.
    return (CAR_KG_PER_KM - WALKING_KG_PER_KM) * distance;
  }

  if (transportMode === "driving" || transportMode === "rideshare") {
    // No saving, they are the car baseline
    return null;
  }

  // Any other/unknown string
  return null;
}

/**
 * Generates a sustainability note sentence for the Gemini prompt based on the chosen transport mode.
 * @param transportMode The mode of transport.
 * @param tripDistanceKm Optional distance in kilometers.
 * @returns A formatted ASCII string to append to the prompt, or an empty string if the mode is unknown.
 */
export function sustainabilityPromptLine(
  transportMode: string,
  tripDistanceKm?: number
): string {
  const distance = tripDistanceKm ?? DEFAULT_DISTANCE_KM;

  if (transportMode === "transit") {
    // Praise line
    const savedKg = co2SavedVsDrivingKg("transit", distance)!;
    return `The fan is travelling by public transit, a low-carbon choice saving about ${savedKg.toFixed(1)} kg of CO2 versus driving. Acknowledge and encourage this in one short sentence of the reasoning.`;
  }

  if (transportMode === "walking") {
    // Praise line
    const savedKg = co2SavedVsDrivingKg("walking", distance)!;
    return `The fan is travelling by walking, a low-carbon choice saving about ${savedKg.toFixed(1)} kg of CO2 versus driving. Acknowledge and encourage this in one short sentence of the reasoning.`;
  }

  if (transportMode === "driving" || transportMode === "rideshare") {
    // Suggestion line: calculate potential transit saving
    const potentialSaving = (CAR_KG_PER_KM - TRANSIT_KG_PER_KM) * distance;
    return `The fan is arriving by car. In one short sentence of the reasoning, gently note that taking public transit for this trip could save about ${potentialSaving.toFixed(1)} kg of CO2.`;
  }

  // Any other/unknown transport mode
  return "";
}
