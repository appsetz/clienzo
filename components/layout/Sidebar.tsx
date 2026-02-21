"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, CreditCard,
  UserPlus, TrendingUp, HelpCircle, ChevronDown, Mail, Target,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import CryptoJS from "crypto-js";

const dashboardItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const mainNavItems = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leads", label: "Leads", icon: Target },
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
  const { collapsed, toggleCollapsed } = useSidebar();

  const getProfilePhotoUrl = () => {
    if ((userProfile as any)?.photoURL) {
      return (userProfile as any).photoURL;
    }
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
    <aside
      className={`hidden md:flex bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex-col z-30 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"
        }`}
    >
      {/* ── Logo / Profile Header ───────────────────────── */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between min-h-[76px]">
        {!collapsed && (
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userProfile?.agencyName || userProfile?.name || "Appsetz"}
            </p>
            {userProfile?.agencyName && (
              <p className="text-xs text-gray-500 truncate">{userProfile.agencyName}</p>
            )}
          </div>
        )}

        {/* Profile avatar — always visible */}
        <Link href="/profile" className="flex-shrink-0" title="Profile">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200 hover:border-teal-400 transition-colors shadow-sm">
            {getProfilePhotoUrl() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getProfilePhotoUrl()!} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {(userProfile?.name || userProfile?.agencyName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {/* Dashboard */}
        <div className="mb-4 px-3">
          {!collapsed && (
            <p className="mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
              Dashboard
            </p>
          )}
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            const href = getDashboardHref();
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 ${active ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-teal-600" : "text-gray-400"}`} />
                {!collapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Main Nav */}
        <div className="px-3 space-y-0.5">
          {!collapsed && (
            <p className="mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
              Menu
            </p>
          )}
          {mainNavItems.map((item) => {
            if (item.agencyOnly && userProfile?.userType !== "agency") return null;
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 ${active ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-teal-600" : "text-gray-400"}`} />
                {!collapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Others */}
        <div className="mt-6 px-3">
          {!collapsed && (
            <p className="mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
              Others
            </p>
          )}
          <div className="space-y-0.5">
            {otherItems.map((item) => {
              const Icon = item.icon;
              if (item.isExternal) {
                return (
                  <a
                    key={item.href}
                    href="mailto:support@clienova.com"
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ${collapsed ? "justify-center" : "justify-between"
                      }`}
                  >
                    <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                      <Icon className="w-5 h-5 flex-shrink-0 text-gray-400" />
                      {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                    </div>
                    {!collapsed && item.hasSubmenu && <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </a>
                );
              }
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 ${active ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${collapsed ? "justify-center" : "justify-between"}`}
                >
                  <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-teal-600" : "text-gray-400"}`} />
                    {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </div>
                  {!collapsed && item.hasSubmenu && <ChevronDown className="w-4 h-4 text-gray-400" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Bottom: Profile link + toggle ──────────────── */}
      <div className="border-t border-gray-100">
        {/* Profile row */}
        <Link
          href="/profile"
          className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition group ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Profile" : undefined}
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {getProfilePhotoUrl() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getProfilePhotoUrl()!} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                {(userProfile?.name || userProfile?.agencyName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {userProfile?.name || userProfile?.agencyName || "Your Name"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userProfile?.userType === "agency" ? "Agency" : "Freelancer"}
              </p>
            </div>
          )}
        </Link>

        {/* Collapse / Expand toggle button */}
        <button
          onClick={toggleCollapsed}
          className={`w-full flex items-center gap-2 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 border-t border-gray-100 ${collapsed ? "justify-center" : ""
            }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>

        {/* Branding */}
        {!collapsed && (
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
        )}
      </div>
    </aside>
  );
}
