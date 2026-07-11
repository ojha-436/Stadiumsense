import { collection, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/hooks";
import { useCollectionSnapshot, type AsyncData } from "@/lib/firestoreHooks";
import { mapPoll, mapPost } from "@/lib/mappers";
import type { Poll, Post } from "@/types/domain";

function usePublishedPostsReal(matchId: string): AsyncData<Post[]> {
  return useCollectionSnapshot(
    query(
      collection(db, COLLECTIONS.posts),
      where("matchId", "==", matchId),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    ),
    mapPost,
    [matchId]
  );
}

function usePollsReal(matchId: string): AsyncData<Poll[]> {
  return useCollectionSnapshot(
    query(
      collection(db, COLLECTIONS.polls),
      where("matchId", "==", matchId),
      orderBy("createdAt", "desc")
    ),
    mapPoll,
    [matchId]
  );
}

export const usePublishedPosts = DEMO ? demo.usePublishedPosts : usePublishedPostsReal;
export const usePolls = DEMO ? demo.usePolls : usePollsReal;
