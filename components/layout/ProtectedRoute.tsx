"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if profile is complete (except on profile-setup page)
      if (userProfile && !userProfile.profileComplete && pathname !== "/profile-setup") {
        router.push("/profile-setup");
        return;
      }

      // If profile is complete and user is on profile-setup, redirect to dashboard
      if (userProfile?.profileComplete && pathname === "/profile-setup") {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, userProfile, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

