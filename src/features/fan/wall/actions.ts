import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import { demoCastVote, demoCreatePost } from "@/lib/demo/writes";

/** Cast a single poll vote (one doc per user, keyed by uid). */
export async function castVote(pollId: string, uid: string, optionId: string): Promise<void> {
  if (DEMO) return demoCastVote(pollId, uid, optionId);
  await setDoc(doc(db, `${COLLECTIONS.polls}/${pollId}/votes/${uid}`), {
    optionId,
    at: serverTimestamp(),
  });
}

/** Submit a fan post (published=false until the moderation trigger clears it). */
export async function createPost(params: {
  matchId: string;
  authorUid: string;
  authorName: string;
  caption: string;
  playerTag?: string;
}): Promise<void> {
  if (DEMO) return demoCreatePost(params);
  await addDoc(collection(db, COLLECTIONS.posts), {
    matchId: params.matchId,
    authorUid: params.authorUid,
    authorName: params.authorName,
    caption: params.caption,
    playerTag: params.playerTag ?? null,
    published: false,
    createdAt: serverTimestamp(),
  });
}
