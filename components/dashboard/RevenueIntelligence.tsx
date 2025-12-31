"use client";

import { useMemo, useState } from "react";
import { Payment, Project, Client } from "@/lib/firebase/db";
import { TrendingUp, DollarSign, Users, BarChart3, AlertCircle, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, eachYearOfInterval, subYears, parseISO } from "date-fns";

interface RevenueIntelligenceProps {
  payments: Payment[];
  projects: Project[];
  clients: Client[];
  userPlan: "free" | "pro" | "agency";
}

export default function RevenueIntelligence({
  payments,
  projects,
  clients,
  userPlan,
}: RevenueIntelligenceProps) {
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"week" | "month" | "year">("month");

  // Calculate last week revenue (7 days)
  const lastWeekRevenue = useMemo(() => {
    const weekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    
    const weekPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= weekStart && paymentDate <= weekEnd;
    });
    
    return weekPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  // Calculate monthly revenue for last 6 months
  const monthlyRevenue = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      return {
        month: format(month, "MMM yyyy"),
        revenue,
      };
    });
  }, [payments]);

  // Calculate yearly revenue for last 3 years
  const yearlyRevenue = useMemo(() => {
    const years = eachYearOfInterval({
      start: subYears(new Date(), 2),
      end: new Date(),
    });

    return years.map((year) => {
      const yearStart = startOfYear(year);
      const yearEnd = endOfYear(year);
      const yearPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate >= yearStart && paymentDate <= yearEnd;
      });
      const revenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);
      return {
        year: format(year, "yyyy"),
        revenue,
      };
    });
  }, [payments]);

  // Calculate pending vs received
  const paymentStats = useMemo(() => {
    const received = payments.reduce((sum, p) => sum + p.amount, 0);
    const pending = projects.reduce((sum, project) => {
      const projectPayments = payments.filter((p) => p.project_id === project.id);
      const paid = projectPayments.reduce((s, p) => s + p.amount, 0);
      const pendingAmount = project.total_amount - paid;
      return sum + (pendingAmount > 0 ? pendingAmount : 0);
    }, 0);

    return { received, pending };
  }, [payments, projects]);

  // Client-wise revenue ranking
  const clientRevenue = useMemo(() => {
    if (userPlan === "free") return [];

    const clientMap = new Map<string, { client: Client; revenue: number }>();

    projects.forEach((project) => {
      const projectPayments = payments.filter((p) => p.project_id === project.id);
      const revenue = projectPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const client = clients.find((c) => c.id === project.client_id);
      if (client) {
        const existing = clientMap.get(client.id!) || { client, revenue: 0 };
        clientMap.set(client.id!, { client, revenue: existing.revenue + revenue });
      }
    });

    return Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [payments, projects, clients, userPlan]);

  const maxRevenue = useMemo(() => {
    if (analyticsPeriod === "week") return Math.max(lastWeekRevenue, 1);
    if (analyticsPeriod === "month") {
      return monthlyRevenue.length > 0
        ? Math.max(...monthlyRevenue.map((m) => m.revenue))
        : 1;
    }
    return yearlyRevenue.length > 0
      ? Math.max(...yearlyRevenue.map((y) => y.revenue))
      : 1;
  }, [analyticsPeriod, lastWeekRevenue, monthlyRevenue, yearlyRevenue]);

  return (
    <div className="space-y-6">
      {/* Revenue Analytics with Period Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
          </div>
          {/* Period Toggle */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAnalyticsPeriod("week")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                analyticsPeriod === "week"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setAnalyticsPeriod("month")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                analyticsPeriod === "month"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnalyticsPeriod("year")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                analyticsPeriod === "year"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Last Week Analytics */}
        {analyticsPeriod === "week" && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-gray-900 mb-2">
                ₹{lastWeekRevenue.toLocaleString()}
              </p>
              <p className="text-gray-600">Last Week Revenue</p>
              <p className="text-sm text-gray-500 mt-2">
                {format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "MMM dd")} - {format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        )}

        {/* Monthly Revenue Graph */}
        {analyticsPeriod === "month" && (
          <div className="space-y-4">
            {monthlyRevenue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment data available
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-2 h-48">
                  {monthlyRevenue.map((month, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col justify-end h-full">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t transition-all hover:opacity-80"
                          style={{
                            height: `${((Number(month.revenue) || 0) / (Number(maxRevenue) || 1)) * 100}%`,
                            minHeight: (Number(month.revenue) || 0) > 0 ? "4px" : "0",
                          }}
                          title={`${month.month}: ₹${month.revenue.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-xs text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {format(new Date(month.month), "MMM")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                  <span>Total: ₹{monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}</span>
                  <span>Avg: ₹{Math.round(monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0) / monthlyRevenue.length).toLocaleString()}/month</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Yearly Revenue Graph */}
        {analyticsPeriod === "year" && (
          <div className="space-y-4">
            {yearlyRevenue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment data available
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4 h-48">
                  {yearlyRevenue.map((year, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col justify-end h-full">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t transition-all hover:opacity-80"
                          style={{
                            height: `${((Number(year.revenue) || 0) / (Number(maxRevenue) || 1)) * 100}%`,
                            minHeight: (Number(year.revenue) || 0) > 0 ? "4px" : "0",
                          }}
                          title={`${year.year}: ₹${year.revenue.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {year.year}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                  <span>Total: ₹{yearlyRevenue.reduce((sum, y) => sum + y.revenue, 0).toLocaleString()}</span>
                  <span>Avg: ₹{Math.round(yearlyRevenue.reduce((sum, y) => sum + y.revenue, 0) / yearlyRevenue.length).toLocaleString()}/year</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pending vs Received */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Received Payments</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{paymentStats.received.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-2">
            {payments.length} payment{payments.length !== 1 ? "s" : ""} received
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{paymentStats.pending.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-2">
            {projects.filter((p) => {
              const projectPayments = payments.filter((pay) => pay.project_id === p.id);
              const paid = projectPayments.reduce((s, pay) => s + pay.amount, 0);
              return p.total_amount - paid > 0;
            }).length} project{projects.length !== 1 ? "s" : ""} with pending payments
          </p>
        </div>
      </div>

      {/* Client Revenue Ranking */}
      {clientRevenue.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Top Clients by Revenue</h2>
          </div>
          <div className="space-y-4">
            {clientRevenue.map((item, idx) => {
              const totalRevenue = clientRevenue.reduce((sum, c) => sum + c.revenue, 0);
              const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={item.client.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.client.name}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">₹{item.revenue.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

