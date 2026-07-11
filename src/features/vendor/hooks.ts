import { collection, doc, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/hooks";
import {
  useCollectionSnapshot,
  useDocSnapshot,
  type AsyncData,
} from "@/lib/firestoreHooks";
import { mapOrder, mapStall } from "@/lib/mappers";
import type { Order, Stall } from "@/types/domain";

function useStallReal(stallId: string | null): AsyncData<Stall | null> {
  return useDocSnapshot(stallId ? doc(db, COLLECTIONS.stalls, stallId) : null, mapStall);
}

function useStallOrdersReal(stallId: string | null): AsyncData<Order[]> {
  return useCollectionSnapshot(
    stallId
      ? query(
          collection(db, COLLECTIONS.orders),
          where("stallId", "==", stallId),
          orderBy("createdAt", "desc")
        )
      : null,
    mapOrder,
    [stallId]
  );
}

export const useStall = DEMO ? demo.useStall : useStallReal;
export const useStallOrders = DEMO ? demo.useStallOrders : useStallOrdersReal;
