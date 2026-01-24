"use client";

import BottomNavigation from "@/components/layout/BottomNavigation";
import { usePathname } from "next/navigation";

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // Don't show bottom nav on public pages or dashboard
  const publicPages = ["/", "/login", "/signup", "/privacy", "/terms", "/profile-setup", "/dashboard"];
  if (publicPages.includes(pathname || "") || pathname?.startsWith("/dashboard/")) {
    return null;
  }

  return <BottomNavigation />;
}
