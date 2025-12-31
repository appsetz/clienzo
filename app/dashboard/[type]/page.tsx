"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import FreelancerDashboard from "@/components/dashboards/FreelancerDashboard";
import AgencyDashboard from "@/components/dashboards/AgencyDashboard";

export default function DashboardTypePage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const type = params.type as string;

  useEffect(() => {
    // Redirect if user type doesn't match
    if (userProfile?.userType && userProfile.userType !== type) {
      router.push(`/dashboard/${userProfile.userType}`);
    }
  }, [userProfile, type, router]);

  if (!userProfile?.userType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on type
  switch (type) {
    case "freelancer":
      return <FreelancerDashboard />;
    case "agency":
      return <AgencyDashboard />;
    default:
      // Redirect to freelancer dashboard if invalid type
      router.push("/dashboard/freelancer");
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
  }
}

