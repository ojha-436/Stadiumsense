/**
 * Bootstrap the first administrator account.
 *
 * The admin console reads staff/access-request data and calls admin-only Cloud
 * Functions, all of which require the caller to hold the `admin` custom claim.
 * That claim is normally granted by `provisionUser` — but that function is
 * itself admin-only, so the very first admin has to be seeded out-of-band with
 * the Admin SDK (which bypasses security rules). Run this once per project.
 *
 * Idempotent: if the account already exists it is reused and its claim/profile
 * are refreshed rather than duplicated.
 *
 * Usage (production — needs owner credentials):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="path\to\serviceAccount.json"
 *   $env:GCLOUD_PROJECT="promptwar-501405"
 *   $env:ADMIN_EMAIL="admin@yourdomain.com"
 *   $env:ADMIN_PASSWORD="a-strong-password"
 *   npm run seed:admin
 *
 * Usage (local emulator):
 *   $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
 *   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
 *   $env:ADMIN_EMAIL="admin@demo.local"; $env:ADMIN_PASSWORD="admin123456"
 *   npm run seed:admin
 */
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.GCLOUD_PROJECT ?? "promptwar-501405";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_NAME ?? "Tournament Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables first.");
  process.exit(1);
}
if (password.length < 6) {
  console.error("ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

const usingEmulator = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
);
if (getApps().length === 0) {
  initializeApp(usingEmulator ? { projectId } : { credential: applicationDefault(), projectId });
}

const auth = getAuth();
const db = getFirestore();

async function seedAdmin() {
  const target = usingEmulator ? "the local emulators" : `project ${projectId}`;
  console.log(`Seeding admin account (${email}) into ${target}…`);

  // Create the auth user, or reuse it if the email is already registered.
  let uid: string;
  try {
    const user = await auth.createUser({ email, password, displayName });
    uid = user.uid;
    console.log(`✓ Created auth user ${uid}`);
  } catch (err) {
    if ((err as { code?: string }).code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email!);
      uid = existing.uid;
      await auth.updateUser(uid, { password, displayName });
      console.log(`✓ Reused existing auth user ${uid} (password reset)`);
    } else {
      throw err;
    }
  }

  // The `admin` role lives ONLY in the custom claim — this is what unlocks the
  // console and passes every Firestore rule / callable guard.
  await auth.setCustomUserClaims(uid, { role: "admin", active: true });
  await auth.revokeRefreshTokens(uid); // force a fresh token carrying the claim

  // Mirror a profile doc so the client routes the account to /admin (the
  // `status` marker is what AuthProvider uses to recognise one of our accounts).
  await db.doc(`users/${uid}`).set(
    {
      role: "admin",
      displayName,
      email,
      lang: "en",
      active: true,
      status: "active",
      createdAt: Date.now(),
    },
    { merge: true }
  );

  console.log("✓ Admin claim + profile set.");
  console.log(`\nSign in at /signin with:\n  email:    ${email}\n  password: (the one you provided)\n`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Admin seed failed:", err);
    process.exit(1);
  });
