import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Fill these in from Firebase Console → Project Settings → Your apps → Web app.
// Free "Spark" plan is enough for everything here — Firestore + Anonymous Auth
// don't require billing to be enabled.
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * MVP auth: every operator device signs in anonymously. That's enough to
 * satisfy the Firestore rule `request.auth != null` without needing a login
 * screen for shift workers.
 */
export function ensureSignedIn(): Promise<void> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await signInAnonymously(auth);
      } else {
        unsub();
        resolve();
      }
    });
  });
}
