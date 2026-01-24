"use client";

import BottomNavigation from "@/components/layout/BottomNavigation";
import { usePathname } from "next/navigation";

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // Don't show bottom nav on public pages only
  const publicPages = ["/", "/login", "/signup", "/privacy", "/terms", "/profile-setup"];
  if (publicPages.includes(pathname || "")) {
    return null;
  }

  return <BottomNavigation />;
}
