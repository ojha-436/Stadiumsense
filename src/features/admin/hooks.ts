import { collection, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { DEMO } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/hooks";
import { useCollectionSnapshot, type AsyncData } from "@/lib/firestoreHooks";
import { mapAccessRequest, mapUser } from "@/lib/mappers";
import type { AccessRequest, UserDoc } from "@/types/domain";

function useStaffUsersReal(): AsyncData<UserDoc[]> {
  return useCollectionSnapshot(
    query(collection(db, COLLECTIONS.users), where("role", "in", ["vendor", "ops", "admin"])),
    mapUser,
    []
  );
}

function usePendingRequestsReal(): AsyncData<AccessRequest[]> {
  return useCollectionSnapshot(
    query(
      collection(db, COLLECTIONS.accessRequests),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    ),
    mapAccessRequest,
    []
  );
}

export const useStaffUsers = DEMO ? demo.useStaffUsers : useStaffUsersReal;
export const usePendingRequests = DEMO ? demo.usePendingRequests : usePendingRequestsReal;
