"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell, Search, User, LogOut, HelpCircle, ChevronDown,
  LayoutDashboard, Users, FolderKanban, CreditCard, UserPlus, Mail,
  TrendingUp, FileText, PieChart, BarChart3
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationsPanel from "../NotificationsPanel";
import md5 from "crypto-js/md5";
import { getClients, Client, getProjects, Project } from "@/lib/firebase/db";

// Search items configuration
const searchItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "summary", "stats"] },
  { label: "Clients", href: "/clients", icon: Users, keywords: ["customers", "contacts", "people", "client list"] },
  { label: "Projects", href: "/projects", icon: FolderKanban, keywords: ["work", "tasks", "jobs", "project list"] },
  { label: "Payments", href: "/payments", icon: CreditCard, keywords: ["money", "revenue", "invoices", "billing", "transactions"] },
  { label: "My Staff", href: "/team", icon: UserPlus, keywords: ["team", "employees", "members", "staff list"], agencyOnly: true },
  { label: "Email Automation", href: "/email-automation", icon: Mail, keywords: ["emails", "automation", "marketing", "campaigns"], agencyOnly: true },
  { label: "Investments", href: "/investments", icon: TrendingUp, keywords: ["invest", "portfolio", "returns", "assets"], agencyOnly: true },
  { label: "Profile", href: "/profile", icon: User, keywords: ["account", "my profile", "personal"] },
  { label: "Revenue Analytics", href: "/dashboard", icon: BarChart3, keywords: ["analytics", "reports", "charts", "graphs", "statistics"] },
  { label: "Project Status", href: "/projects", icon: PieChart, keywords: ["status", "progress", "active", "completed"] },
  { label: "Payment History", href: "/payments", icon: FileText, keywords: ["history", "past payments", "records", "transactions"] },
];

// Get Gravatar URL from email
function getGravatarUrl(email: string, size: number = 80): string {
  const hash = md5(email.toLowerCase().trim()).toString();
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

export default function Header() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load clients and projects for search
  const loadSearchData = useCallback(async () => {
    if (!user) return;
    try {
      const [clientsData, projectsData] = await Promise.all([
        getClients(user.uid),
        getProjects(user.uid),
      ]);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading search data:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSearchData();
    }
  }, [user, loadSearchData]);

  // Filter search items based on query and user type
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return searchItems.filter((item) => {
      // Skip agency-only items for non-agency users
      if (item.agencyOnly && userProfile?.userType !== "agency") {
        return false;
      }

      // Check if label or keywords match
      const labelMatch = item.label.toLowerCase().includes(query);
      const keywordMatch = item.keywords.some((keyword) => keyword.toLowerCase().includes(query));

      return labelMatch || keywordMatch;
    });
  }, [searchQuery, userProfile?.userType]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return clients.filter((client) => 
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(query)
    ).slice(0, 5); // Limit to 5 results
  }, [searchQuery, clients]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return projects.filter((project) => 
      project.name.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results
  }, [searchQuery, projects]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search item click
  const handleSearchItemClick = (href: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(href);
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSearchResults(false);
      setSearchQuery("");
    } else if (e.key === "Enter") {
      if (filteredClients.length > 0) {
        handleSearchItemClick("/clients");
      } else if (filteredProjects.length > 0) {
        handleSearchItemClick("/projects");
      } else if (filteredSearchItems.length > 0) {
        handleSearchItemClick(filteredSearchItems[0].href);
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserName = () => {
    if (userProfile?.name) return userProfile.name;
    if (userProfile?.agencyName) return userProfile.agencyName;
    return user?.email?.split("@")[0] || "User";
  };

  const getRole = () => {
    if (userProfile?.userType === "agency") {
      return userProfile?.agencyName ? `${userProfile.agencyName} Manager` : "Agency Manager";
    }
    return "Freelancer";
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get profile photo URL - priority: uploaded photo > Gravatar
  const getProfilePhotoUrl = () => {
    if ((userProfile as any)?.photoURL) {
      return (userProfile as any).photoURL;
    }
    if (user?.email) {
      return getGravatarUrl(user.email, 80);
    }
    return null;
  };

  const photoUrl = getProfilePhotoUrl();

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Welcome Message */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {getGreeting()}, {getUserName()}!
            </h1>
            <p className="text-sm text-gray-500">{getRole()}</p>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search for any information"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-72 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-gray-900"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                  {(filteredSearchItems.length > 0 || filteredClients.length > 0 || filteredProjects.length > 0) ? (
                    <>
                      {filteredClients.length > 0 && (
                        <>
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">Clients</p>
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => handleSearchItemClick("/clients")}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-teal-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-gray-900">{client.name}</p>
                                {client.email && (
                                  <p className="text-xs text-gray-400 truncate">{client.email}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {filteredProjects.length > 0 && (
                        <>
                          {(filteredClients.length > 0) && (
                            <div className="border-t border-gray-100 my-1"></div>
                          )}
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">Projects</p>
                          {filteredProjects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => handleSearchItemClick("/projects")}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FolderKanban className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{project.status}</p>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {filteredSearchItems.length > 0 && (
                        <>
                          {(filteredClients.length > 0 || filteredProjects.length > 0) && (
                            <div className="border-t border-gray-100 my-1"></div>
                          )}
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                            {(filteredClients.length > 0 || filteredProjects.length > 0) ? "Pages" : "Results"}
                          </p>
                          {filteredSearchItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={index}
                                onClick={() => handleSearchItemClick(item.href)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Icon className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.label}</p>
                                  <p className="text-xs text-gray-400">Navigate to {item.label.toLowerCase()}</p>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No results found</p>
                      <p className="text-xs text-gray-400 mt-1">Try searching for clients, dashboard, projects, or payments</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                        {getUserName().charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        My Profile
                      </Link>
                      <Link
                        href="/support"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        Help & Support
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
