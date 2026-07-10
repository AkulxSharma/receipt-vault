// ─────────────────────────────────────────────────────────────
// FIREBASE CONFIG. Auth + Firestore only (free, no card needed).
// Images go to Cloudinary instead of Firebase Storage, since Firebase
// Storage now requires a Blaze (billing) plan even for free-tier usage.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyA1OxFUpWoICuaCsUpERHo1hQx3r0wapHs",
  authDomain: "reciept-vault-6f2af.firebaseapp.com",
  projectId: "reciept-vault-6f2af",
  storageBucket: "reciept-vault-6f2af.firebasestorage.app",
  messagingSenderId: "850903366782",
  appId: "1:850903366782:web:3a8d45183b440a5f8a2c2f",
  measurementId: "G-KHKQRBXQ9D"
};

// These client keys are SAFE to be public. Firebase security is
// enforced by the Firestore rules, not by hiding this config.

// ─────────────────────────────────────────────────────────────
// CLOUDINARY CONFIG. Free image storage, no card needed.
// Setup (about 3 min):
//   1. Go to https://cloudinary.com/users/register/free and sign up free.
//   2. The dashboard shows your "Cloud name" at the top. Paste it below.
//   3. Open Settings (gear icon), go to Upload, scroll to "Upload presets".
//      Choose "Add upload preset", set Signing Mode to "Unsigned", and Save.
//   4. Copy that preset's name and paste it below.
// ─────────────────────────────────────────────────────────────
export const cloudinaryConfig = {
  cloudName: "xulzdnnc",
  uploadPreset: "RecieptVault"
};
