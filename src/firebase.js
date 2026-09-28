import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Fill these in frontend/.env (see .env.example) — values come from
// Firebase Console > Project settings > Your apps > Web app config.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// getAuth() throws synchronously if the API key is missing/malformed, which
// would otherwise crash the whole app to a blank page before it can even
// show a "Firebase isn't configured yet" message. Guard it instead.
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let _auth = null;
if (firebaseConfigured) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    _auth = getAuth(firebaseApp);
  } catch (e) {
    console.error("Firebase failed to initialize:", e);
  }
}

export const auth = _auth;
