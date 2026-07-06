# Alliance Polysacks — RP Plant Reporting App
### 100% free-tier architecture — no card, no billing plan, anywhere

```
rp-plant-app/
├── mobile/        Expo React Native app (Android) — for operators
└── web-admin/     Next.js app — the Desktop Portal link + all backend logic
```

## Why this stack is genuinely free

| Piece | Where | Cost |
|---|---|---|
| Daily entries (wastage/production/granules) | Firestore, **Spark** (free) plan | ₹0 — well under the free daily quota for one plant |
| Sign-in for operators | Firebase Anonymous Auth | ₹0 — part of Spark |
| Passcode check, admin report, settings, PDFs | **Vercel** serverless functions (Hobby, free) | ₹0 — no card needed to sign up |
| Desktop Portal website | Same Vercel deployment | ₹0 |
| Installable Android app | **EAS Build** free tier | ₹0 — limited builds/month, plenty for one app |

Firebase Cloud Functions were dropped entirely — they need the **Blaze** plan
(pay-as-you-go, requires a card) just to deploy, even if usage stays inside
the free quota. Vercel's own serverless functions do the exact same job
(passcode check, report math, PDF generation) without ever asking for
billing info. Firestore itself stays on Spark — only *Functions* needed Blaze,
and we don't use Firebase Functions anymore.

## What changed vs. the earlier version

- ~~`functions/` (Firebase Cloud Functions)~~ → replaced by `web-admin/app/api/*` (Vercel).
- ~~Cloud Storage + signed URLs for PDFs~~ → PDFs are generated on-the-fly and
  streamed straight back in the HTTP response. No storage bucket needed at all.
- `web-admin` is now a full Next.js app (not just a static page) — it serves
  **both** the Desktop Portal UI and the API routes the phone app calls.

One honest trade-off: the Admin Report PDF is **not password-locked as a file**
on this free path (true PDF encryption needs a `qpdf` binary, which free
serverless platforms won't let you install). The real protection is the
passcode gate before the PDF is ever generated — nobody without the passcode
gets a file in the first place. If you ever want the file itself to also
prompt for a password, that needs one small paid container (a few cents/month)
— easy to add later, not needed to ship now.

## Data model (Firestore)

```
wastageEntries/{plant}_{date}      e.g. oldRp_2026-06-30
productionEntries/{plant}_{date}
granuleIssues/{date}
adminSettings/main                 <-- only ever touched by the Vercel API routes
```

---

## 🚀 Get this running on your Android phone — in order

I can't click through Firebase/Vercel/Expo dashboards from this sandbox (no
internet access here) — but every file is written and syntax-checked. Do
these on your own computer; nothing here needs a credit card.

**0. Install tools once**
```bash
npm install -g firebase-tools eas-cli vercel
```

**1. Create the Firebase project (free Spark plan — do NOT upgrade to Blaze)**
- https://console.firebase.google.com → Add project.
- Build → Firestore Database → Create database (production mode).
- Build → Authentication → Get started → enable **Anonymous** sign-in.
- Skip Storage and Functions entirely — not used anymore.

**2. Deploy just the Firestore rules**
```bash
cd rp-plant-app
firebase login
firebase use --add          # pick the project you made
firebase deploy --only firestore:rules
```

**3. Get a service account key (for the Vercel backend and the seed script)**
- Firebase Console → Project Settings → Service Accounts → Generate new private key.
- Save it as `scripts/serviceAccountKey.json` (never commit this file).

**4. Set the first passcode + rates directly in Firestore**
```bash
node scripts/seed-admin-settings.js
```

**5. Deploy the Desktop Portal + API to Vercel (free, no card)**
```bash
cd web-admin
npm install
vercel login
vercel --prod
```
When it asks for environment variables (or afterwards, in the Vercel dashboard
→ your project → Settings → Environment Variables), add:
- `FIREBASE_SERVICE_ACCOUNT_KEY` = paste the **entire contents** of
  `scripts/serviceAccountKey.json` as one line.

Vercel gives you a real URL like `https://rp-plant-admin-portal.vercel.app` —
open it, enter your passcode (`232003` unless you changed it) — that's your
**working Desktop Portal**, live, today, free.

**6. Point the phone app at both backends**
- `mobile/src/firebase.ts` → fill in the Firebase Web App config
  (Project Settings → Your apps → Add app → Web `</>`).
- `mobile/src/api/adminFunctions.ts` → set `API_BASE` to the Vercel URL from step 5.

**7. Test it fast, before building an APK**
```bash
cd mobile
npm install
npx expo install
npx expo start
```
Install **Expo Go** from the Play Store, scan the QR code. Try Copy (works
immediately) and the PDF download (hits your live Vercel API) right here —
free, no build needed yet.

**8. Build the real installable APK (also free)**
```bash
eas login
eas build -p android --profile preview
```
You get a download link (and email) for a `.apk` — open it on the phone,
download, install (allow "install from unknown sources" once when asked).

---

## Quick sanity check if something doesn't work
- **Copy button missing / does nothing** → needs no backend at all — if it's
  not working, it's almost certainly `expo-clipboard` not installed; re-run
  `npx expo install expo-clipboard`.
- **"Incorrect passcode" even though it's right** → step 4 wasn't run, or
  `scripts/serviceAccountKey.json` doesn't match the project you deployed to.
- **PDF button shows an error** → check `API_BASE` in
  `mobile/src/api/adminFunctions.ts` matches your real Vercel URL exactly
  (no trailing slash), and that `FIREBASE_SERVICE_ACCOUNT_KEY` is set on Vercel.
- **Web portal works but app doesn't (or vice versa)** → they call the *same*
  Vercel API, so if one works and the other doesn't, it's almost always a typo
  in `API_BASE` on the app side.
