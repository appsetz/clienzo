"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { getTeamMembers, getTeamMemberPayments, TeamMember, TeamMemberPayment } from "@/lib/firebase/db";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChart, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import Link from "next/link";

const COLORS = [
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // green
  "#3B82F6", // blue
  "#EF4444", // red
  "#06B6D4", // cyan
  "#F97316", // orange
];

interface TeamPaymentAnalyticsProps {
  userId: string;
}

export default function TeamPaymentAnalytics({ userId }: TeamPaymentAnalyticsProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allPayments, setAllPayments] = useState<TeamMemberPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const members = await getTeamMembers(userId);
      setTeamMembers(members);

      // Load all payments for the agency (without member filter for faster query)
      // This ensures we get all payments including newly added ones
      let payments: TeamMemberPayment[] = [];
      try {
        // First try to get all payments for the agency
        payments = await getTeamMemberPayments(userId);
        console.log(`TeamPaymentAnalytics: Fetched ${payments.length} payments from Firestore`);
      } catch (err) {
        // Fallback: load payments per member if the above fails
        console.warn("Loading payments per member as fallback:", err);
        for (const member of members) {
          if (member.id) {
            try {
              const memberPayments = await getTeamMemberPayments(userId, member.id);
              payments.push(...memberPayments);
            } catch (memberErr) {
              console.error(`Error loading payments for member ${member.id}:`, memberErr);
            }
          }
        }
      }
      
      // Remove duplicates (in case fallback was used)
      const uniquePayments = payments.filter((payment, index, self) =>
        index === self.findIndex((p) => p.id === payment.id)
      );
      
      // Sort payments by date (newest first)
      uniquePayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllPayments(uniquePayments);
      console.log(`TeamPaymentAnalytics: Loaded ${uniquePayments.length} payments for ${members.length} members`);
    } catch (error: any) {
      console.error("Error loading team payment data:", error);
      setAllPayments([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time listener for payments (automatically updates when data changes in Firestore)
  useEffect(() => {
    if (!userId || !pathname?.includes("/dashboard")) return;

    console.log("Setting up real-time listener for team payments from Firestore...");
    
    // Create query for all payments for this agency
    const q = query(
      collection(db, "team_member_payments"),
      where("agency_id", "==", userId),
      orderBy("date", "desc")
    );

    // Set up real-time listener - this will automatically update when payments are added/updated/deleted
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[Real-time] Firestore update: ${snapshot.docs.length} payments found`);
        const payments: TeamMemberPayment[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            agency_id: data.agency_id,
            team_member_id: data.team_member_id,
            amount: data.amount,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            notes: data.notes || undefined,
            project_id: data.project_id || undefined,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          };
        });
        
        // Sort by date (newest first)
        payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllPayments(payments);
        setLoading(false);
        console.log(`[Real-time] Analytics updated with ${payments.length} payments from Firestore`);
      },
      (error) => {
        console.error("Error in real-time listener:", error);
        setLoading(false);
        // Fallback to regular load if real-time fails (e.g., missing index)
        if (error.code === "failed-precondition" || error.message?.includes("index")) {
          console.warn("Index required for real-time listener, falling back to regular load");
          loadData();
        } else {
          // For other errors, try regular load
          loadData();
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("Cleaning up real-time listener");
      unsubscribe();
    };
  }, [userId, pathname, loadData]);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

  // Reload data when navigating back to dashboard from payments page
  useEffect(() => {
    // If we were on payments page and now on dashboard, reload
    if (previousPathname.current?.includes("/team/payments") && pathname?.includes("/dashboard")) {
      console.log("Navigated back to dashboard, reloading team payment data...");
      loadData();
    }
    previousPathname.current = pathname;
  }, [pathname, loadData]);

  // Reload data when the page becomes visible or window gets focus
  useEffect(() => {
    if (!pathname?.includes("/dashboard")) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && userId && pathname?.includes("/dashboard")) {
        console.log("Page visible, reloading team payment data...");
        loadData();
      }
    };

    const handleFocus = () => {
      if (userId && pathname?.includes("/dashboard")) {
        console.log("Window focused, reloading team payment data...");
        loadData();
      }
    };

    // Listen for custom event when team payment is updated
    const handlePaymentUpdate = () => {
      if (userId && pathname?.includes("/dashboard")) {
        console.log("Team payment updated event received, reloading data...");
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("teamPaymentUpdated", handlePaymentUpdate);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("teamPaymentUpdated", handlePaymentUpdate);
    };
  }, [userId, pathname, loadData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Analytics calculations
  const totalPaid = allPayments.length > 0 ? allPayments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
  const thisMonthPayments = allPayments.filter((p) => {
    if (!p.date) return false;
    const paymentDate = new Date(p.date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPayments.length > 0 ? thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;

  // Payment distribution by member for pie chart and analytics
  const paymentByMember = teamMembers.map((member) => {
    const memberPayments = allPayments.filter((p) => p.team_member_id === member.id);
    const total = memberPayments.length > 0 ? memberPayments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
    const thisMonthMemberPayments = memberPayments.filter((p) => {
      if (!p.date) return false;
      const paymentDate = new Date(p.date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });
    const thisMonthTotal = thisMonthMemberPayments.length > 0 ? thisMonthMemberPayments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
    return {
      id: member.id,
      name: member.name,
      role: member.role,
      value: total,
      count: memberPayments.length,
      thisMonthTotal,
      thisMonthCount: thisMonthMemberPayments.length,
    };
  }).sort((a, b) => b.value - a.value); // Sort by total amount (highest first)

  if (teamMembers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Team Payment Analytics
          </h3>
          <Link href="/team" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            Manage Team →
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No team members yet</p>
          <Link
            href="/team"
            className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            Add Team Members
          </Link>
        </div>
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Team Payment Analytics
          </h3>
          <Link href="/team/payments" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-gray-900">₹0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-900">₹0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Team Members</p>
            <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No payments recorded yet</p>
          <Link
            href="/team/payments"
            className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            Add First Payment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Team Payment Analytics
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/team/payments" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View All →
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹{thisMonthTotal.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{allPayments.length}</p>
            </div>
            <PieChart className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Member Payment Breakdown */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-700 mb-4">Payment Breakdown by Member</h4>
        {teamMembers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No team members yet</p>
        ) : paymentByMember.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No payments recorded yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentByMember.map((member, index) => (
              <div key={member.id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{member.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{member.count} payment{member.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pie Chart - Payment Distribution */}
      {paymentByMember.filter((item) => item.value > 0).length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">Payment Distribution Chart</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={paymentByMember.filter((item) => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentByMember.filter((item) => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number | undefined) => value ? `₹${value.toLocaleString()}` : '₹0'} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

