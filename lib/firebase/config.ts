import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
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

// Initialize Firestore
// For browser: try persistent cache. For server: use default.
export const db: Firestore = (() => {
  if (typeof window !== "undefined") {
    // Browser: try to initialize with persistent cache
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache()
      });
    } catch (error: any) {
      // If already initialized (failed-precondition) or other error, use getFirestore
      if (error.code === "failed-precondition" || error.code === "already-in-use") {
        // Already initialized, use existing instance
        return getFirestore(app);
      }
      // Other error, fall back to default
      console.warn("Failed to initialize persistent cache, using default:", error);
      return getFirestore(app);
    }
  } else {
    // Server-side: use default initialization
    return getFirestore(app);
  }
})();

// Initialize Storage
export const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics (only in browser)
export const analytics: Analytics | null = 
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;

