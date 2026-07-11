import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Initialise the Admin SDK exactly once per runtime instance.
if (getApps().length === 0) initializeApp();

export const db = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
