"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, getProjects, getPayments, Client, Project, Payment } from "@/lib/firebase/db";
import { Users, FolderKanban, CreditCard, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import UpgradeModal from "@/components/UpgradeModal";
import { checkClientLimit, checkProjectLimit, getPlanLimits } from "@/lib/plan-limits";
import RevenueIntelligence from "@/components/dashboard/RevenueIntelligence";
import PaymentTimeline from "@/components/dashboard/PaymentTimeline";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [clientsData, projectsData, paymentsData] = await Promise.all([
        getClients(user.uid),
        getProjects(user.uid),
        getPayments(user.uid),
      ]);
      
      console.log("Dashboard data loaded:", {
        clients: clientsData.length,
        projects: projectsData.length,
        payments: paymentsData.length,
      });
      
      setClients(clientsData);
      setProjects(projectsData);
      setPayments(paymentsData);

      // Check if user is at limits and show upgrade prompt (only for free plan)
      if (userProfile?.plan === "free") {
        const [atClientLimit, atProjectLimit] = await Promise.all([
          checkClientLimit(user.uid, "free").then(canAdd => !canAdd),
          checkProjectLimit(user.uid, "free").then(canAdd => !canAdd),
        ]);
        
        if (atClientLimit || atProjectLimit) {
          // Show upgrade modal after a short delay
          setTimeout(() => {
            setShowUpgradeModal(true);
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      console.error("Error details:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      });
      
      // Show more specific error message
      let errorMessage = "Error loading data. ";
      if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
        errorMessage += "Firestore index required. Please create the index using the link in the error message, or check FIRESTORE_INDEXES.md for instructions.";
      } else if (error?.code === "permission-denied") {
        errorMessage += "Permission denied. Please check Firestore security rules.";
      } else if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please refresh the page. Check console for details.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const activeProjects = projects.filter((p) => p.status === "active");
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthRevenue = payments
    .filter((p) => {
      const paymentDate = new Date(p.date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = projects.reduce((sum, project) => {
    const projectPayments = payments.filter((p) => p.project_id === project.id);
    const paid = projectPayments.reduce((s, p) => s + p.amount, 0);
    const pending = project.total_amount - paid;
    return sum + (pending > 0 ? pending : 0);
  }, 0);

  const upcomingReminders = projects
    .filter((p) => {
      if (!p.reminder_date || userProfile?.plan !== "pro") return false;
      const reminderDate = new Date(p.reminder_date);
      const today = new Date();
      const diffDays = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {userProfile?.name || "User"}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={clients.length}
          color="purple"
          href="/clients"
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={activeProjects.length}
          color="blue"
          href="/projects"
        />
        <StatCard
          icon={CreditCard}
          label="Pending Payments"
          value={`₹${pendingPayments.toLocaleString()}`}
          color="orange"
          href="/payments"
        />
        {userProfile?.plan !== "free" ? (
          <StatCard
            icon={TrendingUp}
            label="Monthly Revenue"
            value={`₹${thisMonthRevenue.toLocaleString()}`}
            color="green"
          />
        ) : (
          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            color="green"
          />
        )}
      </div>

      {/* Revenue Intelligence - Pro Feature */}
      <RevenueIntelligence
        payments={payments}
        projects={projects}
        clients={clients}
        userPlan={userProfile?.plan || "free"}
      />

      {/* Follow-up & Deadline Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Follow-up & Deadlines</h2>
        </div>
        
        {/* Overdue Projects - Show for all users */}
        {projects.filter((p) => {
          if (!p.deadline || p.status !== "active") return false;
          const deadline = new Date(p.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          deadline.setHours(0, 0, 0, 0);
          return deadline < today;
        }).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900 text-red-700">Overdue Projects</h3>
            </div>
            <div className="space-y-2">
              {projects
                .filter((p) => {
                  if (!p.deadline || p.status !== "active") return false;
                  const deadline = new Date(p.deadline);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  deadline.setHours(0, 0, 0, 0);
                  return deadline < today;
                })
                .map((project) => {
                  const deadline = new Date(project.deadline!);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  deadline.setHours(0, 0, 0, 0);
                  const daysOverdue = Math.ceil((today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-red-600">
                            {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue - {format(deadline, "MMM dd, yyyy")}
                          </p>
                        </div>
                        <span className="text-sm text-red-600 font-medium">View →</span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines - Show for all users */}
        {projects.filter((p) => {
          if (!p.deadline || p.status !== "active") return false;
          const deadline = new Date(p.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          deadline.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        }).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Upcoming Deadlines (Next 7 Days)</h3>
            </div>
            <div className="space-y-2">
              {projects
                .filter((p) => {
                  if (!p.deadline || p.status !== "active") return false;
                  const deadline = new Date(p.deadline);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  deadline.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays >= 0 && diffDays <= 7;
                })
                .sort((a, b) => {
                  const dateA = new Date(a.deadline!).getTime();
                  const dateB = new Date(b.deadline!).getTime();
                  return dateA - dateB;
                })
                .map((project) => {
                  const deadline = new Date(project.deadline!);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  deadline.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-orange-600">
                            Deadline in {diffDays} day{diffDays !== 1 ? "s" : ""} - {format(deadline, "MMM dd, yyyy")}
                          </p>
                        </div>
                        <span className="text-sm text-orange-600 font-medium">View →</span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Follow-up Reminders - Pro Feature Only */}
        {userProfile?.plan === "pro" && upcomingReminders.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Follow-up Reminders</h3>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-blue-600">
                        Reminder: {format(new Date(project.reminder_date!), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.filter((p) => {
          if (!p.deadline || p.status !== "active") return false;
          const deadline = new Date(p.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          deadline.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays < 0 || (diffDays >= 0 && diffDays <= 7);
        }).length === 0 && (userProfile?.plan !== "pro" || upcomingReminders.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>No upcoming deadlines or reminders</p>
            {userProfile?.plan === "free" && (
              <p className="text-sm mt-2 text-gray-400">
                Upgrade to Pro for follow-up reminders and advanced deadline tracking
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment Timeline - Pro Feature */}
      {userProfile?.plan === "pro" && (
        <PaymentTimeline payments={payments} projects={projects} limit={5} />
      )}

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/projects" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View all →
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No projects yet</p>
            <Link
              href="/projects/new"
              className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => {
              const projectPayments = payments.filter((p) => p.project_id === project.id);
              const paid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
              const progress = (paid / project.total_amount) * 100;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>₹{project.total_amount.toLocaleString()}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="You're at Your Free Plan Limits!"
        message="You've reached your free plan limits. Upgrade to Pro to unlock unlimited clients, projects, and powerful features."
        limitType="general"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  href?: string;
}) {
  const colorClasses = {
    purple: "from-purple-500 to-pink-500",
    blue: "from-blue-500 to-cyan-500",
    orange: "from-orange-500 to-red-500",
    green: "from-green-500 to-emerald-500",
  };

  const content = (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

