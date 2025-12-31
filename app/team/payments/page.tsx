"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  getTeamMembers,
  TeamMember,
  getTeamMemberPayments,
  createTeamMemberPayment,
  updateTeamMemberPayment,
  deleteTeamMemberPayment,
  TeamMemberPayment,
} from "@/lib/firebase/db";
import { Plus, X, Save, DollarSign, Calendar, Trash2, Edit2, TrendingUp, Users, PieChart } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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

export default function TeamPaymentsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allPayments, setAllPayments] = useState<TeamMemberPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TeamMemberPayment | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    team_member_id: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    project_id: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not an agency
  useEffect(() => {
    if (userProfile && userProfile.userType !== "agency") {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const members = await getTeamMembers(user.uid);
      setTeamMembers(members);

      // Load all payments for the agency (without member filter for faster query)
      // This ensures we get all payments including newly added ones
      let payments: TeamMemberPayment[] = [];
      try {
        // First try to get all payments for the agency
        payments = await getTeamMemberPayments(user.uid);
      } catch (err) {
        // Fallback: load payments per member if the above fails
        console.warn("Loading payments per member as fallback:", err);
        for (const member of members) {
          if (member.id) {
            try {
              const memberPayments = await getTeamMemberPayments(user.uid, member.id);
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
      
      // Sort payments by date (newest first) to ensure new payments appear at top
      uniquePayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllPayments(uniquePayments);
      setError(""); // Clear any previous errors
      console.log(`Loaded ${uniquePayments.length} total payments for ${members.length} team members`);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && userProfile?.userType === "agency") {
      loadData();
    }
  }, [user, userProfile, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setSubmitting(true);
    try {
      console.log("Submitting payment form:", paymentForm);
      
      if (editingPayment) {
        console.log("Updating payment:", editingPayment.id);
        await updateTeamMemberPayment(editingPayment.id!, {
          amount: parseFloat(paymentForm.amount) || 0,
          date: new Date(paymentForm.date),
          notes: paymentForm.notes?.trim() || undefined,
          project_id: paymentForm.project_id?.trim() || undefined,
        });
        console.log("Payment updated successfully");
      } else {
        console.log("Creating new payment for member:", paymentForm.team_member_id);
        const paymentId = await createTeamMemberPayment({
          agency_id: user.uid,
          team_member_id: paymentForm.team_member_id,
          amount: parseFloat(paymentForm.amount) || 0,
          date: new Date(paymentForm.date),
          notes: paymentForm.notes?.trim() || undefined,
          project_id: paymentForm.project_id?.trim() || undefined,
        });
        console.log("Payment created successfully with ID:", paymentId);
      }
      
      // Close modal first
      setShowModal(false);
      setEditingPayment(null);
      setSelectedMember(null);
      setPaymentForm({
        team_member_id: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        project_id: "",
      });
      
      // Wait a moment for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload data immediately - Firestore writes are synchronous
      console.log("Reloading payment data...");
      await loadData();
      console.log("Payment data reloaded");
      
      // Dispatch custom event to notify dashboard to refresh
      window.dispatchEvent(new CustomEvent("teamPaymentUpdated"));
    } catch (err: any) {
      console.error("Error saving payment:", err);
      console.error("Full error object:", err);
      if (err.code) {
        console.error("Firebase error code:", err.code);
      }
      if (err.message) {
        console.error("Error message:", err.message);
      }
      setError(err.message || "Failed to save payment. Please check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (payment: TeamMemberPayment) => {
    setEditingPayment(payment);
    setSelectedMember(teamMembers.find((m) => m.id === payment.team_member_id) || null);
    setPaymentForm({
      team_member_id: payment.team_member_id,
      amount: payment.amount.toString(),
      date: format(payment.date, "yyyy-MM-dd"),
      notes: payment.notes || "",
      project_id: payment.project_id || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await deleteTeamMemberPayment(paymentId);
      // Optimistically update UI
      setAllPayments(prev => prev.filter(p => p.id !== paymentId));
      // Reload to ensure consistency
      await loadData();
      
      // Dispatch custom event to notify dashboard to refresh
      window.dispatchEvent(new CustomEvent("teamPaymentUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to delete payment");
      // Reload on error to restore correct state
      await loadData();
    }
  };

  // Analytics calculations
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthPayments = allPayments.filter((p) => {
    const paymentDate = new Date(p.date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Payment distribution by member for pie chart and analytics
  const paymentByMember = teamMembers.map((member) => {
    const memberPayments = allPayments.filter((p) => p.team_member_id === member.id);
    const total = memberPayments.reduce((sum, p) => sum + p.amount, 0);
    const thisMonthMemberPayments = memberPayments.filter((p) => {
      const paymentDate = new Date(p.date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });
    const thisMonthTotal = thisMonthMemberPayments.reduce((sum, p) => sum + p.amount, 0);
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

  // Monthly trend (last 6 months)
  const monthlyTrend: Array<{ month: string; amount: number; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(monthStart);
    const monthPayments = allPayments.filter((p) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    });
    monthlyTrend.push({
      month: format(monthStart, "MMM yyyy"),
      amount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      count: monthPayments.length,
    });
  }

  if (userProfile?.userType !== "agency") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Team payments are only available for agencies.</p>
        </div>
      </div>
    );
  }

  if (loading && allPayments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Team Payments</h1>
          <p className="text-gray-600">Track and manage payments to your team members</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setEditingPayment(null);
            setSelectedMember(null);
            setPaymentForm({
              team_member_id: "",
              amount: "",
              date: format(new Date(), "yyyy-MM-dd"),
              notes: "",
              project_id: "",
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Payment
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && allPayments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Refreshing payments...</span>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹{thisMonthTotal.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{allPayments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Member Payment Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Payment Breakdown by Member
        </h3>
        {paymentByMember.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No payments recorded for any team member yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentByMember.map((member, index) => (
              <div key={member.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Paid</span>
                    <span className="text-lg font-bold text-gray-900">₹{member.value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="text-sm font-semibold text-purple-600">₹{member.thisMonthTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Payments</span>
                    <span className="text-sm font-medium text-gray-700">{member.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Payment Distribution */}
        {paymentByMember.filter((item) => item.value > 0).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Payment Distribution by Member
            </h3>
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

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Payment Trend
          </h3>
          <div className="space-y-4">
            {monthlyTrend.map((month, index) => {
              const maxAmount = Math.max(...monthlyTrend.map((m) => m.amount), 1);
              const percentage = (month.amount / maxAmount) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">{month.month}</span>
                    <span className="text-gray-900 font-semibold">₹{month.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{month.count} payment{month.count !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payments List by Member */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Payments</h3>
        </div>
        <div className="overflow-x-auto">
          {allPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments yet</h3>
              <p className="text-gray-600 mb-6">Add your first payment to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                <Plus className="w-5 h-5" />
                Add First Payment
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allPayments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => {
                    const member = teamMembers.find((m) => m.id === payment.team_member_id);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                              {member?.name.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member?.name || "Unknown"}</div>
                              <div className="text-sm text-gray-500">{member?.role || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(payment.date, "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {payment.notes || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(payment)}
                              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                              title="Edit Payment"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id!)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowModal(false);
                setEditingPayment(null);
                setSelectedMember(null);
                setPaymentForm({
                  team_member_id: "",
                  amount: "",
                  date: format(new Date(), "yyyy-MM-dd"),
                  notes: "",
                  project_id: "",
                });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingPayment ? "Edit Payment" : "Add Payment"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Member *</label>
                <select
                  value={paymentForm.team_member_id}
                  onChange={(e) => {
                    const member = teamMembers.find((m) => m.id === e.target.value);
                    setSelectedMember(member || null);
                    setPaymentForm({ ...paymentForm, team_member_id: e.target.value });
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select a member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Payment notes..."
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPayment(null);
                    setSelectedMember(null);
                    setPaymentForm({
                      team_member_id: "",
                      amount: "",
                      date: format(new Date(), "yyyy-MM-dd"),
                      notes: "",
                      project_id: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingPayment ? "Update" : "Add"} Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

