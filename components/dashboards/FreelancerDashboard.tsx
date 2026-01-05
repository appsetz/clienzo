"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, getProjects, getPayments, Client, Project, Payment } from "@/lib/firebase/db";
import { Users, FolderKanban, CreditCard, TrendingUp, AlertCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import Link from "next/link";
import ReviewPrompt from "@/components/ReviewPrompt";
import { useFeatureFeedback } from "@/hooks/useFeatureFeedback";
import RevenueIntelligence from "@/components/dashboard/RevenueIntelligence";
import ArcChart from "@/components/dashboard/ArcChart";
import PaymentTimeline from "@/components/dashboard/PaymentTimeline";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { filterPaymentsByMonth, filterProjectsByMonth, calculateMonthlyRevenue, getMonthlyChartData, filterClientsByMonth } from "@/lib/dateUtils";
import { exportToCSV } from "@/lib/utils/exportData";

export default function FreelancerDashboard() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "projects">("overview");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const { showPrompt: showReviewPrompt, handleFeedbackSubmitted, handleClose } = useFeatureFeedback();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [clientsData, projectsData, paymentsData] = await Promise.all([
        getClients(user.uid),
        getProjects(user.uid),
        getPayments(user.uid),
      ]);
      
      setClients(clientsData);
      setProjects(projectsData);
      setPayments(paymentsData);
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

  // Filter data by selected month - must be before any early returns
  const monthlyPayments = useMemo(() => filterPaymentsByMonth(payments, selectedMonth), [payments, selectedMonth]);
  const monthlyProjects = useMemo(() => filterProjectsByMonth(projects, selectedMonth), [projects, selectedMonth]);
  const monthlyClients = useMemo(() => filterClientsByMonth(clients, selectedMonth), [clients, selectedMonth]);
  const selectedMonthRevenue = useMemo(() => calculateMonthlyRevenue(payments, selectedMonth), [payments, selectedMonth]);

  const lastMonthRevenue = useMemo(() => {
    const lastMonth = subMonths(selectedMonth, 1);
    return calculateMonthlyRevenue(payments, lastMonth);
  }, [payments, selectedMonth]);

  // Chart data for the area chart (last 12 months ending at selected month)
  const chartData = useMemo(() => getMonthlyChartData(payments, projects, 11, selectedMonth), [payments, projects, selectedMonth]);

  // Prepare data for arc charts - using all-time data by default, can switch to monthly
  const projectStatusData = useMemo(() => [
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
  ].filter((item) => item.value > 0), [projects]);

  // Monthly payment data for the arc chart
  const monthlyPaid = useMemo(() => monthlyPayments.reduce((sum, p) => sum + p.amount, 0), [monthlyPayments]);

  const pendingPayments = useMemo(() => projects.reduce((sum, project) => {
    const projectPayments = payments.filter((p) => p.project_id === project.id);
    const paid = projectPayments.reduce((s, p) => s + p.amount, 0);
    const pending = project.total_amount - paid;
    return sum + (pending > 0 ? pending : 0);
  }, 0), [projects, payments]);

  const paymentStatusData = useMemo(() => [
    {
      name: `Paid in ${format(selectedMonth, "MMM")}`,
      value: monthlyPaid,
    },
    {
      name: "Pending",
      value: pendingPayments,
    },
  ].filter((item) => item.value > 0), [monthlyPaid, pendingPayments, selectedMonth]);

  const upcomingReminders = useMemo(() => projects
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
    }), [projects]);

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
  const completedProjects = projects.filter((p) => p.status === "completed");
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthRevenue = selectedMonthRevenue;

  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0;

  const newClientsThisMonth = monthlyClients.length;
  const maxPayment = Math.max(...chartData.map((d) => d.payments), 1);

  // Handle export
  const handleExport = () => {
    const exportData = [
      ...clients.map(c => ({ type: "Client", name: c.name, email: c.email || "", phone: c.phone || "", createdAt: c.createdAt })),
      ...projects.map(p => ({ type: "Project", name: p.name, status: p.status, amount: p.total_amount, createdAt: p.createdAt })),
      ...payments.map(p => ({ type: "Payment", amount: p.amount, date: p.date, createdAt: p.createdAt })),
    ];
    exportToCSV(exportData, "dashboard_data");
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile?.name || "Freelancer"}!
          </h1>
          <p className="text-gray-600">Here&apos;s your business overview</p>
        </div>
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          minDate={subMonths(new Date(), 24)}
          maxDate={new Date()}
        />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clients Card */}
        <Link href="/clients" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition group">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">No of Clients</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                {newClientsThisMonth > 0 && (
                  <span className="text-xs text-teal-600">{newClientsThisMonth}+ new clients</span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>Active</span>
                  <span className="font-medium text-gray-700">{clients.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Revenue Card */}
        <Link href="/payments" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition group">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(1)}L` : `${(totalRevenue / 1000).toFixed(0)}K`}</p>
                {revenueGrowth !== 0 && (
                  <span className={`flex items-center text-xs ${revenueGrowth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(revenueGrowth).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div>
                  <span className="text-gray-400">This Month</span>
                  <span className="font-medium text-gray-700 ml-1">₹{(thisMonthRevenue / 1000).toFixed(0)}K</span>
                </div>
                <div>
                  <span className="text-gray-400">Last Month</span>
                  <span className="font-medium text-gray-700 ml-1">₹{(lastMonthRevenue / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Projects Card */}
        <Link href="/projects" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition group">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Total Projects</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  <span>Active</span>
                  <span className="font-medium text-gray-700">{activeProjects.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>Completed</span>
                  <span className="font-medium text-gray-700">{completedProjects.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Payments Card */}
        <Link href="/payments" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition group">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">No of Payments</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                <span className="text-xs text-teal-600">{clients.length}+ clients</span>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div>
                  <span className="text-gray-400">Pending</span>
                  <span className="font-medium text-gray-700 ml-1">₹{(pendingPayments / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
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
          title={`Payment Status - ${format(selectedMonth, "MMMM yyyy")}`}
          data={paymentStatusData}
          height={300}
          innerRadius={60}
          outerRadius={120}
        />
      </div>

      {/* Revenue Intelligence */}
      <div>
        <RevenueIntelligence
          payments={payments}
          projects={projects}
          clients={clients}
          userPlan={userProfile?.plan || "free"}
          selectedMonth={selectedMonth}
        />
      </div>

      {/* Payment Timeline */}
      <PaymentTimeline
        payments={monthlyPayments.length > 0 ? monthlyPayments : payments.slice(0, 5)}
        projects={projects}
        limit={5}
        title={monthlyPayments.length > 0 ? `Payments in ${format(selectedMonth, "MMMM yyyy")}` : "Recent Payments"}
      />

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

