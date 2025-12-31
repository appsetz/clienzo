"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, CreditCard, Bell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/payments", label: "Payments", icon: CreditCard },
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
            src="/images/clienzo-logo.png"
            alt="Clienzo"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
        {userProfile?.plan === "free" && (
          <Link
            href="/upgrade"
            className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-center font-semibold hover:shadow-lg transition"
          >
            Upgrade to Pro
          </Link>
        )}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Plan: <span className="font-semibold capitalize">{userProfile?.plan || "Free"}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

