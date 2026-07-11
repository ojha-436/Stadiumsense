/** Runtime configuration, read once from the environment. */
export const CONFIG = {
  location: process.env.GCLOUD_LOCATION ?? "us-central1",
  flashModel: process.env.GEMINI_FLASH_MODEL ?? "gemini-2.0-flash-001",
  proModel: process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-pro",
  mapsKey: process.env.MAPS_SERVER_KEY ?? "",
  /** "fake" uses the offline deterministic gateway (tests / no-billing demo). */
  aiBackend: (process.env.AI_BACKEND ?? "vertex") as "vertex" | "fake",
  get projectId(): string {
    return (
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_CONFIG_PROJECT ??
      ""
    );
  },
} as const;
