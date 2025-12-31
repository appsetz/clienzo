import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD3yB-08nniPxwgAZPwqZT1OqF9TYtZgNQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "clienzo-27582.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "clienzo-27582",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "clienzo-27582.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1001902672676",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1001902672676:web:83ce12494daec2a1c581b1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6YB7CER2QB",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Enable offline persistence (only in browser)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Firestore persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the features required
      console.warn("Firestore persistence not available in this browser");
    } else {
      console.error("Firestore persistence error:", err);
    }
  });
}

// Initialize Analytics (only in browser)
export const analytics: Analytics | null = 
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;

