"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, getPayments, Project, Payment } from "@/lib/firebase/db";
import { Bell, X, AlertCircle, Clock, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export interface Notification {
  id: string;
  type: "deadline" | "overdue" | "reminder" | "payment";
  title: string;
  message: string;
  link?: string;
  priority: "high" | "medium" | "low";
  date: Date;
}

export default function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [projects, payments] = await Promise.all([
        getProjects(user.uid),
        getPayments(user.uid),
      ]);

      const notifs: Notification[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check for overdue projects
      projects.forEach((project) => {
        if (project.deadline) {
          const deadline = new Date(project.deadline);
          deadline.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff < 0 && project.status === "active") {
            notifs.push({
              id: `overdue-${project.id}`,
              type: "overdue",
              title: "Overdue Project",
              message: `${project.name} deadline was ${Math.abs(daysDiff)} day(s) ago`,
              link: `/projects/${project.id}`,
              priority: "high",
              date: deadline,
            });
          } else if (daysDiff >= 0 && daysDiff <= 3 && project.status === "active") {
            notifs.push({
              id: `deadline-${project.id}`,
              type: "deadline",
              title: "Upcoming Deadline",
              message: `${project.name} deadline in ${daysDiff} day(s)`,
              link: `/projects/${project.id}`,
              priority: daysDiff === 0 ? "high" : "medium",
              date: deadline,
            });
          }
        }

        // Check for reminders (Pro feature)
        if (userProfile?.plan === "pro" && project.reminder_date) {
          const reminderDate = new Date(project.reminder_date);
          reminderDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff >= 0 && daysDiff <= 7) {
            notifs.push({
              id: `reminder-${project.id}`,
              type: "reminder",
              title: "Follow-up Reminder",
              message: `Follow up on ${project.name}`,
              link: `/projects/${project.id}`,
              priority: daysDiff <= 1 ? "high" : "medium",
              date: reminderDate,
            });
          }
        }
      });

      // Check for pending payments (Pro feature)
      if (userProfile?.plan === "pro") {
        projects.forEach((project) => {
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
                notifs.push({
                  id: `payment-${project.id}`,
                  type: "payment",
                  title: "Pending Payment",
                  message: `₹${pending.toLocaleString()} pending for ${project.name}`,
                  link: `/projects/${project.id}`,
                  priority: "medium",
                  date: new Date(lastPayment.date),
                });
              }
            }
          }
        });
      }

      // Sort by priority and date
      notifs.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.date.getTime() - b.date.getTime();
      });

      setNotifications(notifs);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user && isOpen) {
      loadNotifications();
    }
  }, [user, isOpen, loadNotifications]);

  if (!isOpen) return null;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "deadline":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "reminder":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-16 right-2 sm:right-4 md:right-6 w-[calc(100vw-1rem)] sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || "#"}
                  onClick={onClose}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(notif.date, "MMM dd, yyyy")}
                      </p>
                    </div>
                    {notif.priority === "high" && (
                      <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

