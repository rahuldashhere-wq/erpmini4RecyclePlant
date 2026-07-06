import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Reads the Firebase service account JSON from an environment variable
 * (set on Vercel — see README). Never commit the actual key file.
 */
function getServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables."
    );
  }
  
  // Sanitize the input to handle markdown backticks, quotes, or accidental trailing characters
  raw = raw.trim();
  
  // If wrapped in double quotes, unwrap it
  if (raw.startsWith('"') && raw.endsWith('"')) {
    raw = raw.slice(1, -1);
  }
  
  // Extract only the content between the first '{' and the last '}'
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    raw = raw.substring(start, end + 1);
  }
  
  return JSON.parse(raw);
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(getServiceAccount()) });
export const db = getFirestore(app);
