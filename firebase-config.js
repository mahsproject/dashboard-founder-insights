// ─── Fill in your Firebase project values here ───────────────────
// Get these from: Firebase Console → Project Settings → Your apps → SDK setup
const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_ME",
  authDomain:        "REPLACE_ME",
  projectId:         "REPLACE_ME",
  storageBucket:     "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId:             "REPLACE_ME"
};
// ─────────────────────────────────────────────────────────────────

firebase.initializeApp(FIREBASE_CONFIG);
window.FI_DB = firebase.firestore();
