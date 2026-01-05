import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

// Re-export auth for convenience
export { auth };

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "agency";
  createdAt: Date;
  profileComplete?: boolean;
  userType?: "freelancer" | "agency" | "business";
  // Freelancer fields
  phone?: string;
  location?: string;
  bio?: string;
  // Agency fields
  agencyName?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  agencyAddress?: string;
  agencyWebsite?: string;
  agencyDescription?: string;
  numberOfEmployees?: string;
  // Business fields
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessType?: string; // e.g., "Service", "Retail", "Restaurant"
  feedback_given?: boolean; // Track if user has submitted feedback
  feedback_skipped?: boolean; // Track if user has skipped feedback
}

export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user profile in Firestore (profile not complete yet)
  const userProfile: UserProfile = {
    id: userCredential.user.uid,
    name,
    email,
    plan: "free",
    createdAt: new Date(),
    profileComplete: false,
  };
  
  await setDoc(doc(db, "users", userCredential.user.uid), userProfile);
  
  return userCredential;
};

export const login = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async (): Promise<void> => {
  return await signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Convert Firestore Timestamp to Date if needed
      const toDate = (timestamp: any): Date => {
        if (timestamp?.toDate) {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        return new Date(timestamp);
      };
      
      return {
        ...data,
        createdAt: toDate(data.createdAt),
      } as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error("Error getting user profile:", error);
    // If offline, return null and let the app handle it
    if (error.code === "unavailable" || error.message?.includes("offline")) {
      console.warn("Firestore is offline, user profile unavailable");
      return null;
    }
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Google Sign In
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const result = await signInWithPopup(auth, googleProvider);
  
  // Check if user profile exists, if not create one (profile not complete yet)
  const userDoc = await getDoc(doc(db, "users", result.user.uid));
  if (!userDoc.exists()) {
    const userProfile: UserProfile = {
      id: result.user.uid,
      name: result.user.displayName || "User",
      email: result.user.email || "",
      plan: "free",
      createdAt: new Date(),
      profileComplete: false, // Always require profile setup for Google sign-in
    };
    await setDoc(doc(db, "users", result.user.uid), userProfile);
  } else {
    // Always check and ensure profileComplete is false if profile is incomplete
    // This ensures Google sign-in users also go through profile setup
    const existingProfile = userDoc.data() as UserProfile;
    if (!existingProfile.profileComplete) {
      await updateDoc(doc(db, "users", result.user.uid), {
        profileComplete: false,
      });
    }
  }
  
  return result;
};

