/**
 * Admin portal access key. Default is a shared digital keyword that can be
 * rotated later (move to Secret Manager / a server check for production).
 * An env override lets each deployment set its own without a code change.
 */
export const ADMIN_ACCESS_KEY = import.meta.env.VITE_ADMIN_KEY || "2026-Fifa";

/** Session flag: admin portal unlocked for this browser tab session. */
export const ADMIN_UNLOCK_KEY = "stadiumsense.admin.unlocked";
