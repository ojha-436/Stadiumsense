import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminStorage } from "../lib/admin.js";
import { requireAuth, requireString } from "../lib/guards.js";
import { getGateway } from "../ai/index.js";

const MAX_TICKET_BYTES = 8 * 1024 * 1024;

/**
 * Reads a ticket image the fan uploaded to Storage (tickets/{uid}/...) and uses
 * Gemini Vision to extract match/seat/gate. The path must be under the caller's
 * own uid — a fan can never ask us to parse another user's upload.
 */
export const parseTicket = onCall({ enforceAppCheck: true, memory: "512MiB" }, async (req) => {
  const caller = requireAuth(req);
  const imagePath = requireString(req.data?.imagePath, "imagePath", 300);

  if (!imagePath.startsWith(`tickets/${caller.uid}/`)) {
    throw new HttpsError("permission-denied", "You may only parse your own ticket upload.");
  }

  const file = adminStorage.bucket().file(imagePath);
  const [exists] = await file.exists();
  if (!exists) throw new HttpsError("not-found", "Ticket image not found.");

  const [meta] = await file.getMetadata();
  const size = Number(meta.size ?? 0);
  if (size > MAX_TICKET_BYTES) throw new HttpsError("invalid-argument", "Ticket image too large.");
  const mimeType = meta.contentType ?? "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new HttpsError("invalid-argument", "Uploaded file is not an image.");
  }

  const [buffer] = await file.download();
  const parsed = await getGateway().parseTicket(buffer.toString("base64"), mimeType);

  // Best-effort cleanup: the image is only needed for this one parse.
  await file.delete().catch(() => undefined);

  return {
    matchId: parsed.matchId,
    seat: {
      section: parsed.section ?? undefined,
      row: parsed.row ?? undefined,
      seat: parsed.seat ?? undefined,
      gate: parsed.gate ?? undefined,
    },
    confidence: parsed.confidence,
    raw: parsed.raw,
  };
});
