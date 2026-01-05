"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, getUserProfile, UserProfile } from "@/lib/firebase/auth";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error refreshing user profile:", error);
        // Don't clear profile on error, keep existing one
      }
    } else {
      setUserProfile(null);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timeout - setting loading to false");
        setLoading(false);
      }
    }, 1500); // 1.5 second timeout - more aggressive

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      
      clearTimeout(timeoutId);
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (isMounted) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Set profile to null if there's an error, but don't block the app
          if (isMounted) {
            setUserProfile(null);
          }
        }
      } else {
        if (isMounted) {
          setUserProfile(null);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

