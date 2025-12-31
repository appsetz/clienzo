"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, User } from "lucide-react";
import MobileMenu from "./MobileMenu";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getProjects, getPayments } from "@/lib/firebase/db";

export default function Header() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Check for notifications
  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const [projects, payments] = await Promise.all([
          getProjects(user.uid),
          getPayments(user.uid),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let hasNotifs = false;

        // Check for overdue projects
        for (const project of projects) {
          if (project.deadline && project.status === "active") {
            const deadline = new Date(project.deadline);
            deadline.setHours(0, 0, 0, 0);
            const daysDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff < 0 || (daysDiff >= 0 && daysDiff <= 3)) {
              hasNotifs = true;
              break;
            }
          }

          // Check for reminders (Pro feature)
          if (userProfile?.plan === "pro" && project.reminder_date) {
            const reminderDate = new Date(project.reminder_date);
            reminderDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff >= 0 && daysDiff <= 7) {
              hasNotifs = true;
              break;
            }
          }
        }

        // Check for pending payments (Pro feature)
        if (!hasNotifs && userProfile?.plan === "pro") {
          for (const project of projects) {
            const projectPayments = payments.filter((p) => p.project_id === project.id);
            const paid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
            const pending = project.total_amount - paid;

            if (pending > 0) {
              const lastPayment = projectPayments.length > 0
                ? projectPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                : null;
              
              if (lastPayment) {
                const daysSincePayment = Math.ceil((today.getTime() - new Date(lastPayment.date).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSincePayment >= 30) {
                  hasNotifs = true;
                  break;
                }
              }
            }
          }
        }

        setHasNotifications(hasNotifs);
      } catch (error) {
        console.error("Error checking notifications:", error);
        setHasNotifications(false);
      }
    };

    checkNotifications();
    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, userProfile]);

  return (
    <>
      <MobileMenu />
      <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 md:left-64 flex items-center justify-between px-4 md:px-6 z-30">
        <div className="flex-1"></div>
        <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <Bell className="w-5 h-5" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
        <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{userProfile?.name || "User"}</p>
            <p className="text-xs text-gray-500 hidden md:block">{userProfile?.email || user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
    </>
  );
}

