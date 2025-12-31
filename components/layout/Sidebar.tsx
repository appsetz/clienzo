"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, CreditCard, Bell, User, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/team", label: "Team", icon: UserPlus, agencyOnly: true },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Image
            src="/images/bg-removed-logo.png"
            alt="Clienova"
            width={250}
            height={83}
            className="h-20 w-auto object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          // Skip Team item if user is not an agency
          if (item.agencyOnly && userProfile?.userType !== "agency") {
            return null;
          }
          
          const Icon = item.icon;
          // Check if dashboard link should redirect to type-specific dashboard
          const href = item.href === "/dashboard" && userProfile?.userType 
            ? `/dashboard/${userProfile.userType}` 
            : item.href;
          const isActive = pathname === item.href || pathname?.startsWith(href);
          
          return (
            <Link
              key={item.href}
              href={href}
              data-tour={item.href === "/dashboard" ? "nav-dashboard" : item.href === "/clients" ? "nav-clients" : item.href === "/projects" ? "nav-projects" : item.href === "/payments" ? "nav-payments" : item.href === "/team" ? "nav-team" : item.href === "/profile" ? "nav-profile" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        {/* All features are now available to everyone */}
      </div>
    </aside>
  );
}

