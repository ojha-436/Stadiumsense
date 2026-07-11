import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../lib/admin.js";

interface PollOption {
  optionId: string;
  label: string;
  count: number;
}

/**
 * Aggregates a poll vote into the poll's option counts inside a transaction.
 * Counts are updated ONLY here (rules forbid clients writing poll docs), so the
 * tally can't be tampered with and one-vote-per-user is guaranteed by the vote
 * document id being the voter's uid.
 */
export const onVoteCreated = onDocumentCreated("polls/{pollId}/votes/{uid}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const optionId = snap.get("optionId") as string;
  const pollRef = db.doc(`polls/${event.params.pollId}`);

  await db.runTransaction(async (tx) => {
    const pollSnap = await tx.get(pollRef);
    if (!pollSnap.exists) return;
    const options = (pollSnap.get("options") as PollOption[]) ?? [];
    const updated = options.map((o) =>
      o.optionId === optionId ? { ...o, count: o.count + 1 } : o
    );
    tx.update(pollRef, { options: updated });
  });
});
