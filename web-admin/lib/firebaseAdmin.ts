import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Reads the Firebase service account JSON from an environment variable
 * (set on Vercel — see README). Never commit the actual key file.
 */
function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables."
    );
  }
  return JSON.parse(raw);
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(getServiceAccount()) });
export const db = getFirestore(app);
