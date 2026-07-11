import { CONFIG } from "../config.js";
import type { AiGateway } from "./gateway.js";
import { FakeGateway } from "./fake.js";
import { GeminiGateway } from "./gemini.js";

let cached: AiGateway | null = null;

/** Returns the configured AI gateway (real Gemini, or the offline fake). */
export function getGateway(): AiGateway {
  if (!cached) {
    cached = CONFIG.aiBackend === "fake" ? new FakeGateway() : new GeminiGateway();
  }
  return cached;
}

export * from "./gateway.js";
