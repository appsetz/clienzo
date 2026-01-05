"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, getPayments, Project, Payment, updateProject } from "@/lib/firebase/db";
import { Bell, X, AlertCircle, Clock, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface Notification {
  id: string;
  type: "deadline" | "overdue" | "reminder" | "payment";
  title: string;
  message: string;
  link?: string;
  priority: "high" | "medium" | "low";
  date: Date;
  projectId?: string; // Store project ID for clearing reminder
}

export default function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

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
              projectId: project.id,
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
              projectId: project.id,
            });
          }
        }

        // Check for reminders
        if (project.reminder_date) {
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
              projectId: project.id,
            });
          }
        }
      });

      // Check for pending payments
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
                projectId: project.id,
              });
            }
          }
        }
      });

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
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      loadNotifications();
    }
  }, [user, isOpen, loadNotifications]);

  // Handle clicking on a reminder - clear the reminder_date from project
  const handleNotificationClick = async (notif: Notification) => {
    // If it's a reminder, clear the reminder_date from the project
    if (notif.type === "reminder" && notif.projectId) {
      try {
        setDismissing(notif.id);
        // Update project to clear reminder_date
        await updateProject(notif.projectId, { reminder_date: undefined });
        // Remove from local state immediately
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      } catch (error) {
        console.error("Error clearing reminder:", error);
      } finally {
        setDismissing(null);
      }
    }
    
    // Navigate to the link
    if (notif.link) {
      router.push(notif.link);
    }
    onClose();
  };

  // Dismiss notification without navigating
  const handleDismiss = async (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (notif.type === "reminder" && notif.projectId) {
      try {
        setDismissing(notif.id);
        await updateProject(notif.projectId, { reminder_date: undefined });
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      } catch (error) {
        console.error("Error dismissing notification:", error);
      } finally {
        setDismissing(null);
      }
    } else {
      // For non-reminder notifications, just remove from local view
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "deadline":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "reminder":
        return <Bell className="w-4 h-4 text-teal-500" />;
      case "payment":
        return <DollarSign className="w-4 h-4 text-green-500" />;
    }
  };

  const getTypeBadge = (type: Notification["type"]) => {
    const styles = {
      overdue: "bg-red-50 text-red-700",
      deadline: "bg-orange-50 text-orange-700",
      reminder: "bg-teal-50 text-teal-700",
      payment: "bg-green-50 text-green-700",
    };
    const labels = {
      overdue: "Overdue",
      deadline: "Deadline",
      reminder: "Reminder",
      payment: "Payment",
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-16 right-2 sm:right-4 md:right-6 w-[calc(100vw-1rem)] sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl z-50 border border-gray-100 max-h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500">{notifications.length} active</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${dismissing === notif.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        {getTypeBadge(notif.type)}
                      </div>
                      <p className="text-xs text-gray-600">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(notif.date, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notif.priority === "high" && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                      {(notif.type === "reminder") && (
                        <button
                          onClick={(e) => handleDismiss(e, notif)}
                          className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
