"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, getProjects, getPayments, getTeamMembers, getInvestments, Client, Project, Payment, Investment } from "@/lib/firebase/db";
import { getEmailSettings } from "@/lib/email/service";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Users, FolderKanban, CreditCard, TrendingUp, AlertCircle, Clock,
  UserPlus, Mail, DollarSign, ArrowUpRight, ArrowDownRight,
  ChevronRight, Calendar, Info, Building2
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import Link from "next/link";
import ReviewPrompt from "@/components/ReviewPrompt";
import { useFeatureFeedback } from "@/hooks/useFeatureFeedback";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { filterPaymentsByMonth, filterProjectsByMonth, filterClientsByMonth, calculateMonthlyRevenue, getMonthlyChartData, getProjectStatusCountsByMonth, getProjectStatusCountsByYear } from "@/lib/dateUtils";

export default function AgencyDashboard() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [emailStats, setEmailStats] = useState({ rulesCount: 0, sentCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [arcChartView, setArcChartView] = useState<"monthly" | "yearly">("monthly");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const { showPrompt: showReviewPrompt, handleFeedbackSubmitted, handleClose } = useFeatureFeedback();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [clientsData, projectsData, paymentsData, teamMembersData, investmentsData, emailSettingsData] = await Promise.all([
        getClients(user.uid),
        getProjects(user.uid),
        getPayments(user.uid),
        getTeamMembers(user.uid).catch(() => []),
        getInvestments(user.uid).catch(() => []),
        getEmailSettings(user.uid).catch(() => null),
      ]);
      
      setClients(clientsData);
      setProjects(projectsData);
      setPayments(paymentsData);
      setTeamMembers(teamMembersData);
      setInvestments(investmentsData);
      setEmailSettings(emailSettingsData);

      try {
        const [rulesSnapshot, logsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "automation_rules"), where("userId", "==", user.uid), where("enabled", "==", true))),
          getDocs(query(collection(db, "email_logs"), where("userId", "==", user.uid), where("status", "==", "sent"))),
        ]);
        setEmailStats({
          rulesCount: rulesSnapshot.size,
          sentCount: logsSnapshot.size,
        });
      } catch (error) {
        console.error("Error loading email stats:", error);
      }
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
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

  // Monthly chart data - using utility function
  const chartData = useMemo(() => getMonthlyChartData(payments, projects, 11, selectedMonth), [payments, projects, selectedMonth]);

  // Client revenue distribution - filtered by selected month
  const clientStats = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return clients.map((client) => {
      const clientProjects = projects.filter((p) => p.client_id === client.id);
      const clientPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return clientProjects.some((proj) => proj.id === p.project_id) &&
          paymentDate >= monthStart && paymentDate <= monthEnd;
      });
      const revenue = clientPayments.reduce((sum, p) => sum + p.amount, 0);

      return { client, revenue, projectCount: clientProjects.length };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [clients, projects, payments, selectedMonth]);

  // Upcoming reminders
  const upcomingReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return projects
      .map((p) => {
        // Check reminder_date first
        if (p.reminder_date) {
          const reminderDate = new Date(p.reminder_date);
          reminderDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 7) {
            return { project: p, date: reminderDate, type: 'reminder' as const };
          }
        }
        
        // Check deadline if no reminder_date or reminder_date is outside range
        if (p.deadline && p.status === 'active') {
          const deadline = new Date(p.deadline);
          deadline.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 7) {
            return { project: p, date: deadline, type: 'deadline' as const };
          }
        }
        
        return null;
      })
      .filter((item): item is { project: Project; date: Date; type: 'reminder' | 'deadline' } => item !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [projects]);

  // Calculate stats - use monthly/yearly filtered data for project status
  const selectedYear = useMemo(() => new Date(selectedMonth.getFullYear(), 0, 1), [selectedMonth]);
  const projectStatusCounts = useMemo(() => {
    if (arcChartView === "monthly") {
      return getProjectStatusCountsByMonth(projects, selectedMonth);
    } else {
      return getProjectStatusCountsByYear(projects, selectedYear);
    }
  }, [projects, selectedMonth, selectedYear, arcChartView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
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

  const pendingPayments = projects.reduce((sum, project) => {
    const projectPayments = payments.filter((p) => p.project_id === project.id);
    const paid = projectPayments.reduce((s, p) => s + p.amount, 0);
    const pending = project.total_amount - paid;
    return sum + (pending > 0 ? pending : 0);
  }, 0);

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const avgProjectValue = projects.length > 0 ? projects.reduce((sum, p) => sum + p.total_amount, 0) / projects.length : 0;
  const minProjectValue = projects.length > 0 ? Math.min(...projects.map(p => p.total_amount)) : 0;
  const maxProjectValue = projects.length > 0 ? Math.max(...projects.map(p => p.total_amount)) : 0;

  // New clients in selected month
  const newClientsThisMonth = monthlyClients.length;

  const maxPayment = Math.max(...chartData.map((d) => d.payments), 1);

  const clientTotalRevenue = clientStats.reduce((sum, c) => sum + c.revenue, 0);

  const colors = ["bg-teal-500", "bg-cyan-500", "bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500"];


  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Summary - {format(selectedMonth, "MMMM yyyy")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Results for all your business data</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              minDate={subMonths(new Date(), 24)}
              maxDate={new Date()}
            />
          </div>
        </div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">Revenue Matrix Funnel</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
              {format(subMonths(selectedMonth, 11), "MMM yyyy")} — {format(selectedMonth, "MMM yyyy")}
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400"></div>
              <span className="text-xs text-gray-600">Payments Received</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-600">Projects Created</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">Completed</span>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-56">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-[10px] text-gray-400">
              <span>{(maxPayment / 1000).toFixed(0)}K</span>
              <span>{(maxPayment * 0.75 / 1000).toFixed(0)}K</span>
              <span>{(maxPayment * 0.5 / 1000).toFixed(0)}K</span>
              <span>{(maxPayment * 0.25 / 1000).toFixed(0)}K</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-12 h-full relative">
              <svg viewBox="0 0 600 200" className="w-full h-48" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="paymentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <line key={i} x1="0" y1={200 * (1 - ratio)} x2="600" y2={200 * (1 - ratio)} stroke="#f1f5f9" strokeWidth="1" />
                ))}

                {/* Area fill */}
                <path
                  d={`M 0,200 ${chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 600;
                    const y = 200 - (d.payments / maxPayment) * 180;
                    return `L ${x},${y}`;
                  }).join(' ')} L 600,200 Z`}
                  fill="url(#paymentGrad)"
                />

                {/* Line */}
                <path
                  d={`M ${chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 600;
                    const y = 200 - (d.payments / maxPayment) * 180;
                    return `${i === 0 ? '' : 'L '}${x},${y}`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                />

                {/* Vertical guide line on hover */}
                {hoveredPoint !== null && (
                  <line
                    x1={(hoveredPoint / (chartData.length - 1)) * 600}
                    y1={0}
                    x2={(hoveredPoint / (chartData.length - 1)) * 600}
                    y2={200}
                    stroke="#e5e7eb"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Interactive Data points */}
                {chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 600;
                  const y = 200 - (d.payments / maxPayment) * 180;
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={i}>
                      {/* Invisible larger hitbox for better hover detection */}
                      <circle
                        cx={x}
                        cy={y}
                        r="20"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Hover highlight ring */}
                      {isHovered && (
                        <>
                          <circle cx={x} cy={y} r="10" fill="#2dd4bf" fillOpacity="0.2" />
                          <circle cx={x} cy={y} r="6" fill="#2dd4bf" fillOpacity="0.3" />
                        </>
                      )}
                      {/* Main point */}
                      <circle cx={x} cy={y} r={isHovered ? 6 : 4} fill="#2dd4bf" className="transition-all duration-150" />
                      <circle cx={x} cy={y} r={isHovered ? 3 : 2} fill="white" className="transition-all duration-150" />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredPoint !== null && chartData[hoveredPoint] && (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs z-20 pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
                  style={{
                    left: `calc(${(hoveredPoint / (chartData.length - 1)) * 100}%)`,
                    top: '-60px',
                  }}
                >
                  <div className="font-semibold mb-1.5 text-sm">{chartData[hoveredPoint].fullMonth || chartData[hoveredPoint].month}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span>₹{chartData[hoveredPoint].payments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>{chartData[hoveredPoint].projectsCreated} created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>{chartData[hoveredPoint].projectsCompleted} done</span>
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}

              {/* X-axis labels */}
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                {chartData.map((d, i) => (
                  <span
                    key={i}
                    className={`cursor-pointer transition-colors ${hoveredPoint === i ? 'text-teal-600 font-medium' : ''}`}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {d.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Client Distribution - Takes 1 column */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">Clients</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
              {format(selectedMonth, "MMM yyyy")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Revenue by client in {format(selectedMonth, "MMMM")}</p>

          {/* Circle visual */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                    <p className="text-[10px] text-gray-500">Clients</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></div>
              <div className="absolute bottom-2 left-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-xl font-bold text-gray-900">₹{(clientTotalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>

          {/* Client bars */}
          <div className="space-y-3">
            {clientStats.map((item, index) => {
              const percentage = clientTotalRevenue > 0 ? (item.revenue / clientTotalRevenue) * 100 : 0;
              return (
                <div key={item.client.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="font-medium text-gray-700 truncate max-w-[100px]">{item.client.name}</span>
                    </div>
                    <span className="text-gray-500">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`${colors[index % colors.length]} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {clientStats.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No clients yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Additional Stats Column */}
        <div className="space-y-4">
          {/* Team Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <h3 className="font-medium text-gray-900">My Staff</h3>
              </div>
              <Link href="/team" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
              <p className="text-xs text-gray-500">Team members</p>
            </div>
          </div>

          {/* Email Automation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-gray-900">Email Automation</h3>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${emailSettings?.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xl font-bold text-gray-900">{emailStats.rulesCount}</p>
                <p className="text-[10px] text-gray-500">Active Rules</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xl font-bold text-gray-900">{emailStats.sentCount}</p>
                <p className="text-[10px] text-gray-500">Emails Sent</p>
              </div>
            </div>
            <Link 
              href="/email-automation"
              className="block w-full text-center py-2 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 transition"
            >
              Configure Automation
            </Link>
          </div>

          {/* Investments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h3 className="font-medium text-gray-900">Investments</h3>
              </div>
              <Link href="/investments" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View all →
              </Link>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{totalInvestments.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{investments.length} total investments</p>
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                Project Status{arcChartView === "monthly" ? ` - ${format(selectedMonth, "MMMM yyyy")}` : ` - ${format(selectedYear, "yyyy")}`}
              </h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            {/* Toggle for Monthly/Yearly View */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setArcChartView("monthly")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    arcChartView === "monthly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setArcChartView("yearly")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    arcChartView === "yearly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>

          {projects.length > 0 ? (
            <>
              {/* Donut Chart */}
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 100 100" className="w-40 h-40">
                  {(() => {
                    const statusCounts = [
                      { name: "Active", value: projectStatusCounts.active, color: "#14b8a6" },
                      { name: "Completed", value: projectStatusCounts.completed, color: "#3b82f6" },
                      { name: "On Hold", value: projectStatusCounts.onHold, color: "#f59e0b" },
                      { name: "Cancelled", value: projectStatusCounts.cancelled, color: "#ef4444" },
                    ].filter(s => s.value > 0);
                    
                    const total = statusCounts.reduce((sum, s) => sum + s.value, 0);
                    let currentAngle = -90;
                    
                    return statusCounts.map((status, i) => {
                      const angle = (status.value / total) * 360;
                      const startAngle = currentAngle;
                      currentAngle += angle;
                      
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = ((startAngle + angle) * Math.PI) / 180;
                      
                      const x1 = 50 + 35 * Math.cos(startRad);
                      const y1 = 50 + 35 * Math.sin(startRad);
                      const x2 = 50 + 35 * Math.cos(endRad);
                      const y2 = 50 + 35 * Math.sin(endRad);
                      
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      return (
                        <path
                          key={i}
                          d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={status.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    });
                  })()}
                  <circle cx="50" cy="50" r="22" fill="white" />
                  <text x="50" y="47" textAnchor="middle" className="text-lg font-bold fill-gray-900" fontSize="14">
                    {projectStatusCounts.total}
                  </text>
                  <text x="50" y="58" textAnchor="middle" className="fill-gray-500" fontSize="6">
                    Projects
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Active", value: projectStatusCounts.active, color: "bg-teal-500" },
                  { name: "Completed", value: projectStatusCounts.completed, color: "bg-blue-500" },
                  { name: "On Hold", value: projectStatusCounts.onHold, color: "bg-amber-500" },
                  { name: "Cancelled", value: projectStatusCounts.cancelled, color: "bg-red-500" },
                ].filter(s => s.value > 0).map((status, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.color}`}></div>
                    <span className="text-gray-600">{status.name}: {status.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <FolderKanban className="w-10 h-10 mb-2" />
              <p className="text-sm">No projects yet</p>
            </div>
          )}
        </div>

        {/* Follow-up Reminders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-medium text-gray-900">Follow-up Reminders</h3>
            </div>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {upcomingReminders.length} upcoming
            </span>
          </div>
          
          {upcomingReminders.length > 0 ? (
            <div className="space-y-2">
              {upcomingReminders.slice(0, 5).map((item) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysDiff = Math.ceil((item.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <Link
                    key={item.project.id}
                    href={`/projects/${item.project.id}`}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.project.name}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.type === 'deadline' ? 'Deadline' : 'Follow up'} {format(item.date, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      daysDiff === 0 ? "bg-red-100 text-red-700" :
                      daysDiff <= 1 ? "bg-orange-100 text-orange-700" :
                      "bg-teal-100 text-teal-700"
                    }`}>
                      {daysDiff === 0 ? "Today" : daysDiff === 1 ? "Tomorrow" : `${daysDiff}d`}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming reminders</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
          </div>
          <Link href="/projects" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-10">
            <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">No projects yet</p>
            <Link
              href="/projects"
              className="inline-block px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Project Name</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Total Amount</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Paid</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Pending</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((project) => {
                  const projectPayments = payments.filter((p) => p.project_id === project.id);
                  const paid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
                  const pending = project.total_amount - paid;
                  return (
                    <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-3">
                        <Link href={`/projects/${project.id}`} className="text-sm font-medium text-gray-900 hover:text-teal-600 transition">
                          {project.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                          project.status === "active" ? "bg-green-100 text-green-700" :
                          project.status === "completed" ? "bg-blue-100 text-blue-700" :
                          project.status === "on-hold" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">₹{project.total_amount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-sm text-green-600 font-medium">₹{paid.toLocaleString()}</td>
                      <td className="py-3 px-3 text-sm text-orange-600 font-medium">₹{pending > 0 ? pending.toLocaleString() : 0}</td>
                      <td className="py-3 px-3 text-xs text-gray-500">
                        {project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Investments */}
      {investments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <h2 className="text-base font-semibold text-gray-900">Recent Investments</h2>
            </div>
            <Link href="/investments" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {investments.slice(0, 6).map((investment) => (
              <div
                key={investment.id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{investment.name}</h3>
                  <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-full capitalize">
                    {investment.payment_method}
                  </span>
                </div>
                <p className="text-lg font-bold text-teal-600">₹{investment.amount.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-1">{format(new Date(investment.date), "MMM dd, yyyy")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReviewPrompt
        isOpen={showReviewPrompt}
        onClose={handleClose}
        onSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}
