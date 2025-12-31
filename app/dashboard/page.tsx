"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const router = useRouter();

  // Redirect to appropriate dashboard based on user type
  useEffect(() => {
    if (userProfile?.userType) {
      router.push(`/dashboard/${userProfile.userType}`);
    } else if (userProfile && !userProfile.userType) {
      // If user doesn't have a type, redirect to profile setup
      router.push("/profile-setup");
    }
  }, [userProfile, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
