"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, getProjects, getPayments, getTeamMembers, Client, Project, Payment } from "@/lib/firebase/db";
import { Users, FolderKanban, CreditCard, TrendingUp, AlertCircle, Clock, UserPlus, Building2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import ReviewPrompt from "@/components/ReviewPrompt";
import { useFeatureFeedback } from "@/hooks/useFeatureFeedback";
import RevenueIntelligence from "@/components/dashboard/RevenueIntelligence";
import PaymentTimeline from "@/components/dashboard/PaymentTimeline";
import TeamPaymentAnalytics from "@/components/dashboard/TeamPaymentAnalytics";
import ArcChart from "@/components/dashboard/ArcChart";
import DashboardTour from "@/components/DashboardTour";

export default function AgencyDashboard() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showPrompt: showReviewPrompt, handleFeedbackSubmitted, handleClose } = useFeatureFeedback();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [clientsData, projectsData, paymentsData, teamMembersData] = await Promise.all([
        getClients(user.uid),
        getProjects(user.uid),
        getPayments(user.uid),
        getTeamMembers(user.uid).catch(() => []),
      ]);
      
      setClients(clientsData);
      setProjects(projectsData);
      setPayments(paymentsData);
      setTeamMembers(teamMembersData);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      alert("Error loading data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
      if (!p.reminder_date) return false;
      const reminderDate = new Date(p.reminder_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 7;
    })
    .sort((a, b) => {
      const dateA = a.reminder_date ? new Date(a.reminder_date).getTime() : 0;
      const dateB = b.reminder_date ? new Date(b.reminder_date).getTime() : 0;
      return dateA - dateB;
    });

  // Prepare data for arc charts
  const projectStatusData = [
    {
      name: "Active",
      value: projects.filter((p) => p.status === "active").length,
    },
    {
      name: "Completed",
      value: projects.filter((p) => p.status === "completed").length,
    },
    {
      name: "On Hold",
      value: projects.filter((p) => p.status === "on-hold").length,
    },
    {
      name: "Cancelled",
      value: projects.filter((p) => p.status === "cancelled").length,
    },
  ].filter((item) => item.value > 0);

  const paymentStatusData = [
    {
      name: "Paid",
      value: payments.reduce((sum, p) => sum + p.amount, 0),
    },
    {
      name: "Pending",
      value: pendingPayments,
    },
  ].filter((item) => item.value > 0);

  const StatCard = ({ icon: Icon, label, value, color, href }: any) => (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${color.replace("text-", "bg-").replace("-600", "-100")} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Link>
  );

  // Check if user is new (has no data)
  const isNewUser = clients.length === 0 && projects.length === 0 && payments.length === 0 && teamMembers.length === 0;

  return (
    <div className="space-y-6">
      <DashboardTour isNewUser={isNewUser} userType="agency" />
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile?.agencyName || userProfile?.name || "Agency"}!
        </h1>
        <p className="text-gray-600">Agency dashboard - Manage your team and clients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-tour="dashboard-stats">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={clients.length}
          color="text-blue-600"
          href="/clients"
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={activeProjects.length}
          color="text-purple-600"
          href="/projects"
        />
        <StatCard
          icon={CreditCard}
          label="Pending Payments"
          value={`₹${pendingPayments.toLocaleString()}`}
          color="text-orange-600"
          href="/payments"
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={`₹${thisMonthRevenue.toLocaleString()}`}
          color="text-green-600"
          href="/dashboard/agency"
        />
        <StatCard
          icon={UserPlus}
          label="Team Members"
          value={teamMembers.length}
          color="text-indigo-600"
          href="/team"
        />
      </div>

      {/* Follow-up Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Follow-up Reminders</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              {upcomingReminders.slice(0, 5).map((project) => {
                const reminderDate = project.reminder_date ? new Date(project.reminder_date) : new Date();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysDiff = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">
                        Follow up on {format(reminderDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      daysDiff === 0 ? "bg-red-100 text-red-700" :
                      daysDiff <= 1 ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {daysDiff === 0 ? "Today" : daysDiff === 1 ? "Tomorrow" : `${daysDiff} days`}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Arc Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArcChart
          title="Project Status Distribution"
          data={projectStatusData}
          height={300}
          innerRadius={60}
          outerRadius={120}
        />
        <ArcChart
          title="Payment Status Overview"
          data={paymentStatusData}
          height={300}
          innerRadius={60}
          outerRadius={120}
        />
      </div>

      {/* Revenue Intelligence */}
      <RevenueIntelligence
        payments={payments}
        projects={projects}
        clients={clients}
        userPlan={userProfile?.plan || "free"}
      />

      {/* Payment Timeline */}
      <PaymentTimeline payments={payments} projects={projects} limit={5} />

      {/* Team Payment Analytics */}
      {user && <TeamPaymentAnalytics userId={user.uid} />}

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
              href="/projects"
              className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => {
              const projectPayments = payments.filter((p) => p.project_id === project.id);
              const paid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
              const pending = project.total_amount - paid;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">
                        {project.deadline ? `Due: ${format(new Date(project.deadline), "MMM dd, yyyy")}` : "No deadline"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{project.total_amount.toLocaleString()}</p>
                      {pending > 0 && (
                        <p className="text-sm text-orange-600">₹{pending.toLocaleString()} pending</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ReviewPrompt
        isOpen={showReviewPrompt}
        onClose={handleClose}
        onSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}

