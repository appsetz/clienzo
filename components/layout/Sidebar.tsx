"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, CreditCard,
  UserPlus, TrendingUp, HelpCircle, ChevronDown, Mail
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CryptoJS from "crypto-js";

const dashboardItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const mainNavItems = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/team", label: "My Staff", icon: UserPlus, agencyOnly: true },
  { href: "/email-automation", label: "Email Automation", icon: Mail, agencyOnly: true },
  { href: "/investments", label: "Investments", icon: TrendingUp, agencyOnly: true },
];

const otherItems = [
  { href: "/support", label: "Support", icon: HelpCircle, hasSubmenu: true, isExternal: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  // Get profile photo URL (custom or Gravatar)
  const getProfilePhotoUrl = () => {
    // First check for custom uploaded photo
    if ((userProfile as any)?.photoURL) {
      return (userProfile as any).photoURL;
    }
    
    // Fall back to Gravatar
    if (userProfile?.email) {
      const hash = CryptoJS.MD5(userProfile.email.toLowerCase().trim()).toString();
      return `https://www.gravatar.com/avatar/${hash}?s=80&d=identicon`;
    }
    
    return null;
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname?.startsWith("/dashboard/");
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const getDashboardHref = () => {
    return userProfile?.userType ? `/dashboard/${userProfile.userType}` : "/dashboard";
  };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex-col z-30">
      {/* Logo Section with Profile */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userProfile?.agencyName || userProfile?.name || "Appsetz"}
            </p>
          </div>
          {/* Profile Photo */}
          <Link href="/profile" className="flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-teal-200 hover:border-teal-400 transition-colors shadow-md">
              {getProfilePhotoUrl() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getProfilePhotoUrl()!}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {(userProfile?.name || userProfile?.agencyName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>
        </div>
        {userProfile?.agencyName && (
          <p className="text-xs text-gray-500 mt-2 pl-1">{userProfile.agencyName}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard Section */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            DASHBOARD
          </p>
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            const href = getDashboardHref();
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-teal-600" : "text-gray-400"}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            // Skip agency-only items for non-agency users
            if (item.agencyOnly && userProfile?.userType !== "agency") {
              return null;
            }

            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-teal-600" : "text-gray-400"}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Others Section */}
        <div className="mt-8">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            OTHERS
          </p>
          <div className="space-y-1">
            {otherItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              if (item.isExternal) {
                return (
                  <a
                    key={item.href}
                    href="mailto:support@clienova.com"
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {item.hasSubmenu && <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${active ? "text-teal-600" : "text-gray-400"}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {item.hasSubmenu && <ChevronDown className="w-4 h-4 text-gray-400" />}
                </Link>
              );
            })}

          </div>
        </div>
      </nav>

      {/* Bottom Section - Profile & Branding */}
      <div className="border-t border-gray-100">
        {/* Profile Section */}
        <Link
          href="/profile"
          className="flex items-center gap-3 p-4 hover:bg-gray-50 transition group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {getProfilePhotoUrl() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getProfilePhotoUrl()!}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {(userProfile?.name || userProfile?.agencyName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {userProfile?.name || userProfile?.agencyName || "Your Name"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userProfile?.userType === "agency" ? "Agency" : "Freelancer"}
            </p>
          </div>
        </Link>

        {/* Clienova Branding Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 opacity-70">
            <Image
              src="/images/logo-header.png"
              alt="Clienova"
              width={80}
              height={24}
              className="h-5 w-auto object-contain opacity-60"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
