// Run once, after `firebase deploy`, with:
//   node scripts/seed-admin-settings.js
//
// Needs a service account key — download it from
// Firebase Console → Project Settings → Service Accounts → Generate new private key
// and save it as scripts/serviceAccountKey.json (keep this file out of git!).

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function main() {
  await db.collection("adminSettings").doc("main").set({
    passcodeHash: hash("232003"),
    oldRp: { rate: 2.10, dedBoth: 4025 },
    newRp: { rate: 2.75, dedBoth: 3760 },
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("adminSettings/main seeded. Initial passcode: 232003");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
