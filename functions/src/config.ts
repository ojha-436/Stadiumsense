/** Runtime configuration, read once from the environment. */
export const CONFIG = {
  location: process.env.GCLOUD_LOCATION ?? "us-central1",
  flashModel: process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash",
  proModel: process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-flash",
  mapsKey: process.env.MAPS_SERVER_KEY ?? "",
  /**
   * Vertex AI Express Mode API key (bound from Secret Manager via the
   * `secrets` option on each AI-using function). Authenticates directly
   * against aiplatform.googleapis.com — no ADC/service-account IAM needed for
   * the Gemini calls themselves, and the key never reaches the client.
   */
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  /** "fake" uses the offline deterministic gateway (tests / no-billing demo). */
  aiBackend: (process.env.AI_BACKEND ?? "gemini") as "gemini" | "fake",
  get projectId(): string {
    return (
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_CONFIG_PROJECT ??
      ""
    );
  },
} as const;
