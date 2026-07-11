import { onDocumentCreated } from "firebase-functions/v2/firestore";
import "../lib/admin.js"; // ensure Admin SDK is initialised
import { getGateway } from "../ai/index.js";

/**
 * Moderates a new fan post with Gemini before it appears on the wall, and
 * generates descriptive alt text for accessibility. Approved posts are flipped
 * to published; rejected posts are deleted. This is the ONLY path that can set
 * published=true (fans create posts with published=false; rules forbid the flip).
 */
export const onPostCreated = onDocumentCreated(
  { document: "posts/{postId}", memory: "512MiB" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const post = snap.data() as { caption: string; published: boolean };
    if (post.published) return;

    const result = await getGateway().moderatePost(post.caption);
    if (!result.allowed) {
      await snap.ref.delete();
      return;
    }
    await snap.ref.update({ published: true, altText: result.altText });
  }
);
