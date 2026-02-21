"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, CreditCard, UserPlus, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const bottomNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/investments", label: "Investments", icon: TrendingUp, agencyOnly: true },
  { href: "/team", label: "Staff", icon: UserPlus, agencyOnly: true },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Filter items based on user type
  const visibleItems = bottomNavItems.filter(
    (item) => !item.agencyOnly || userProfile?.userType === "agency"
  );

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 w-full">
        <div className="flex items-center justify-between h-16 px-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-lg transition-colors hover:bg-gray-50"
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-teal-600" : "text-gray-400"
                    }`}
                />
                <span
                  className={`text-[9px] font-medium ${active ? "text-teal-600" : "text-gray-600"
                    }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
