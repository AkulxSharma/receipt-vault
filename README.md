# ReceiptVault

Photograph a receipt and the app reads the **store, amount and date** for you, stores the
**photo and its data** in the cloud, and shows your **monthly and yearly spending**. Export
everything as CSV at tax season.

Built as a portfolio project at **$0 cost**, using the Firebase free (Spark) plan for auth and database, plus the Cloudinary free tier for images. (Firebase Storage now requires a billing account even for free usage, so images live on Cloudinary instead.)

## Features
- Google sign-in (each user sees only their own receipts)
- Back-camera capture on phones (`capture="environment"`)
- On-device OCR (Tesseract.js) fills in store, amount and date, which you can edit before saving
- Auto image compression (max 1200px, JPEG 0.7) so storage stays tiny
- Live dashboard: this-month and this-year totals, monthly bar chart, category doughnut
- Search and filter all receipts, tap an image to zoom, delete
- Export CSV (for taxes) and JSON backup

## Tech
Plain HTML/CSS/JS (no build step). Firebase Auth + Firestore. Cloudinary (images). Tesseract.js. Chart.js.

---

## Setup (one time, about 10 min, free, no credit card)

### 1. Create a Firebase project
1. Go to <https://console.firebase.google.com>, click **Add project**, name it, and create it.
2. In the project, click the **`</>` (Web)** icon to register a web app, give it a nickname, then **Register**.
3. Firebase shows a `firebaseConfig = { ... }` object. Copy those values into **`firebase-config.js`**.

### 2. Turn on Authentication + Firestore
- **Authentication**: Get started, open Sign-in method, enable **Google**, then Save.
- **Firestore Database**: Create database, choose **Production mode**, pick a region.
- Skip **Storage**. It now requires a billing (Blaze) plan even for free usage, so images are handled by Cloudinary instead (step 3 below).

### 3. Create a free Cloudinary account (for receipt images)
1. Visit <https://cloudinary.com/users/register/free> and sign up. No card required.
2. The dashboard shows your **Cloud name** at the top. Paste it into `cloudinaryConfig.cloudName` in `firebase-config.js`.
3. Open Settings (gear icon), go to the **Upload** tab, scroll to **Upload presets**, then **Add upload preset**.
4. Set **Signing Mode** to **Unsigned** and Save.
5. Copy that preset's name into `cloudinaryConfig.uploadPreset`.

Free tier: 25GB storage plus bandwidth, well beyond family use.

### 4. Paste Firestore security rules (so each user only touches their own data)

**Firestore** (Firestore, then Rules). These rules bind every document to its owner
and validate the shape and size of each field on create. Documents are immutable
(no `update` rule), so validation only has to run at creation time:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /receipts/{id} {
      // Read and delete only your own receipts.
      allow read, delete: if request.auth != null
        && resource.data.uid == request.auth.uid;

      // Create only a well-formed receipt owned by the signed-in user.
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.keys().hasOnly(
             ['uid','brand','category','amount','date','imgUrl','createdAt'])
        && request.resource.data.brand is string
        && request.resource.data.brand.size() <= 100
        && request.resource.data.category is string
        && request.resource.data.category.size() <= 50
        && request.resource.data.amount is number
        && request.resource.data.amount >= 0
        && request.resource.data.amount <= 1000000
        && request.resource.data.date is string
        && request.resource.data.date.size() <= 10
        && request.resource.data.imgUrl is string
        && request.resource.data.imgUrl.size() <= 500
        && request.resource.data.imgUrl.matches('https://res(-[a-z0-9]+)?[.]cloudinary[.]com/.*')
        && request.resource.data.createdAt == request.time;

      // Documents are immutable once written.
      allow update: if false;
    }
  }
}
```

> Why these are stronger than the minimal version: the original rules let a
> signed-in user write **any** shape of document (arbitrary field names, huge
> strings, negative or non-numeric amounts, an `imgUrl` pointing anywhere). The
> hardened rules pin the exact field set, enforce types and length caps, cap the
> amount, force `imgUrl` to a Cloudinary https URL, and stamp `createdAt` with
> the server time. `read`/`delete` were already correctly scoped to the owner's
> `uid`, so cross-user access was never possible.

### 5. Authorize your domains
In Authentication, open **Settings**, then **Authorized domains**, and add:
- `localhost` (already there, for local testing)
- `YOURNAME.github.io` (your GitHub Pages domain)

---

## Run locally
Google sign-in needs `http://localhost` (not `file://`). From this folder:
```
python3 -m http.server 5173
```
Open <http://localhost:5173>.

## Deploy (GitHub Pages, free)
1. Create a new GitHub repo and upload this folder's files.
2. In the repo, open Settings, then Pages, and set Source to the `main` branch, `/root`, then Save.
3. Wait about a minute. The site goes live at `https://YOURNAME.github.io/repo-name/`.
4. Make sure that domain is in Firebase **Authorized domains** (step 4 above).

## Security hardening

- **Cloudinary unsigned uploads:** the cloud name + preset are public, so anyone
  can POST images to the preset (spam, storage/bandwidth exhaustion, hosting
  arbitrary images under your account). In the preset settings, restrict to a
  dedicated folder, set **Allowed formats** to `jpg,png,webp`, cap **Max file
  size** and image dimensions, and enable **moderation**. For a real deployment,
  move to **signed uploads** via a small serverless function so the browser
  never holds upload authority. Note: deleted receipts leave their image behind
  (no delete without a secret key client-side) - acceptable at family scale but
  a retention/privacy item to document.
- **Content-Security-Policy:** the app ships without a CSP. Prefer setting it as
  a response header at the host; a `<meta>` tag works for GitHub Pages. A CSP
  that fits the current CDNs (test Google sign-in popups before enforcing):
  ```
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://lh3.googleusercontent.com;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.cloudinary.com https://cdn.jsdelivr.net;
  worker-src 'self' blob:;
  frame-src https://reciept-vault-6f2af.firebaseapp.com https://*.firebaseapp.com;
  object-src 'none'; base-uri 'self';
  ```
  Tesseract.js needs `worker-src blob:` and `img-src blob:`; Chart.js is covered
  by `script-src` jsdelivr; Firebase auth popups need the `frame-src`/`connect-src`
  Google origins. Add other recommended headers at the host too:
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in the CSP).
- **Subresource Integrity (SRI):** the Tesseract.js and Chart.js `<script>` tags
  have no `integrity` hash, so a compromised CDN could serve altered code. Pin
  exact versions and add `integrity="sha384-..." crossorigin="anonymous"` to
  those two tags. The Firebase SDK is imported as ES modules from gstatic and the
  Tesseract worker/wasm are fetched dynamically, so SRI cannot cover those; rely
  on the CSP allow-list for them.

## Notes and limits
- OCR accuracy on crumpled or faded receipts is about 70 to 85 percent, which is why every field stays editable before save.
- Free tier: 50k Firestore reads per day, 25GB Cloudinary storage, well beyond a family's use.
- Client config keys in `firebase-config.js` are meant to be public. Security comes from the Firestore rules above.
- Deleting a receipt removes its Firestore record. The Cloudinary image stays stored (unsigned uploads cannot be deleted without exposing a secret key client-side), which is a non-issue at this scale given the 25GB free tier.
