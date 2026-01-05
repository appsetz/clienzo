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
import { Plus, X, Save, DollarSign, Calendar, Trash2, Edit2, TrendingUp, Users, PieChart, ArrowLeft } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import Link from "next/link";
import { getEmailSettings, queueInvoiceEmailWithPDF } from "@/lib/email/service";
import type { InvoiceData } from "@/components/InvoiceGenerator";

const COLORS = [
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // green
  "#f97316", // orange
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

      let payments: TeamMemberPayment[] = [];
      try {
        payments = await getTeamMemberPayments(user.uid);
      } catch (err) {
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
      
      const uniquePayments = payments.filter((payment, index, self) =>
        index === self.findIndex((p) => p.id === payment.id)
      );
      
      uniquePayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllPayments(uniquePayments);
      setError("");
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
      if (editingPayment) {
        await updateTeamMemberPayment(editingPayment.id!, {
          amount: parseFloat(paymentForm.amount) || 0,
          date: new Date(paymentForm.date),
          notes: paymentForm.notes?.trim() || undefined,
          project_id: paymentForm.project_id?.trim() || undefined,
        });
      } else {
        await createTeamMemberPayment({
          agency_id: user.uid,
          team_member_id: paymentForm.team_member_id,
          amount: parseFloat(paymentForm.amount) || 0,
          date: new Date(paymentForm.date),
          notes: paymentForm.notes?.trim() || undefined,
          project_id: paymentForm.project_id?.trim() || undefined,
        });

        // Send payment confirmation email with invoice PDF to team member
        if (user && userProfile?.userType === "agency" && paymentForm.team_member_id) {
          try {
            const teamMember = teamMembers.find((m) => m.id === paymentForm.team_member_id);
            if (teamMember && teamMember.email) {
              const settings = await getEmailSettings(user.uid);
              if (settings && settings.enabled) {
                const agencyName = userProfile?.agencyName || userProfile?.name || "Your Agency";
                const paymentAmount = parseFloat(paymentForm.amount);
                const invoiceNumber = `STF-${teamMember.id?.slice(0, 8).toUpperCase() || 'XXX'}-${Date.now().toString().slice(-6)}`;
                
                // Prepare invoice data for staff payment (adapting InvoiceData structure)
                // Using team member as "client" and creating a minimal project structure
                const invoiceData: InvoiceData = {
                  invoiceNumber,
                  invoiceDate: new Date(paymentForm.date),
                  client: {
                    id: teamMember.id || "",
                    user_id: user.uid,
                    name: teamMember.name,
                    email: teamMember.email,
                    phone: "",
                    notes: "",
                    createdAt: teamMember.createdAt,
                    updatedAt: teamMember.updatedAt,
                  },
                  project: {
                    id: paymentForm.project_id || "staff-payment",
                    user_id: user.uid,
                    client_id: teamMember.id || "",
                    name: paymentForm.project_id ? "Project Payment" : "Staff Payment",
                    status: "completed" as const,
                    total_amount: paymentAmount,
                    deadline: new Date(paymentForm.date),
                    createdAt: new Date(paymentForm.date),
                    updatedAt: new Date(paymentForm.date),
                  },
                  items: [
                    {
                      description: paymentForm.notes || "Payment for services rendered",
                      amount: paymentAmount,
                      date: new Date(paymentForm.date),
                      paymentType: "staff-payment",
                    },
                  ],
                  totalAmount: paymentAmount,
                  paidAmount: paymentAmount,
                  pendingAmount: 0,
                  notes: paymentForm.notes || undefined,
                };

                const emailSubject = `Payment Sent - Invoice ${invoiceNumber}`;
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #16a34a;">Payment Sent</h2>
                    <p>Hi ${teamMember.name},</p>
                    <p>We've sent your payment of ₹${paymentAmount.toLocaleString()}.</p>
                    <p>Please find attached the invoice for your records.</p>
                    <p><strong>Invoice #:</strong> ${invoiceNumber}<br>
                    <strong>Amount:</strong> ₹${paymentAmount.toLocaleString()}<br>
                    <strong>Date:</strong> ${new Date(paymentForm.date).toLocaleDateString()}</p>
                    <p>Thank you for your hard work!</p>
                    <p>Best regards,<br>${agencyName}</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280;">This is a transactional email from ${agencyName}</p>
                  </div>
                `;
                
                await queueInvoiceEmailWithPDF(
                  user.uid,
                  invoiceData,
                  userProfile,
                  teamMember.email,
                  emailSubject,
                  emailBody
                );
                
                // Process queue immediately to send email instantly
                try {
                  await fetch("/api/email/process-queue", { method: "GET" });
                } catch (queueError) {
                  console.error("Error processing email queue:", queueError);
                }
              }
            }
          } catch (emailError) {
            console.error("Error sending payment confirmation email with invoice to team member:", emailError);
            // Don't fail payment creation if email fails
          }
        }
      }
      
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
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
      window.dispatchEvent(new CustomEvent("teamPaymentUpdated"));
    } catch (err: any) {
      console.error("Error saving payment:", err);
      setError(err.message || "Failed to save payment.");
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
      setAllPayments(prev => prev.filter(p => p.id !== paymentId));
      await loadData();
      window.dispatchEvent(new CustomEvent("teamPaymentUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to delete payment");
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

  // Payment distribution by member
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
  }).sort((a, b) => b.value - a.value);

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
        <p className="text-sm text-gray-600">Staff payments are only available for agencies.</p>
      </div>
    );
  }

  if (loading && allPayments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/team"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Staff Payments</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track and manage payments to your team members</p>
            </div>
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
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && allPayments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Refreshing payments...</span>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹{thisMonthTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{allPayments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Payment Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-600" />
          Payment Breakdown by Member
        </h3>
        {paymentByMember.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No payments recorded for any team member yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentByMember.map((member, index) => (
              <div key={member.id || index} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{member.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{member.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total Paid</span>
                    <span className="text-sm font-bold text-gray-900">₹{member.value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">This Month</span>
                    <span className="text-xs font-semibold text-teal-600">₹{member.thisMonthTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Payments</span>
                    <span className="text-xs font-medium text-gray-700">{member.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        {paymentByMember.filter((item) => item.value > 0).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-600" />
              Payment Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie
                  data={paymentByMember.filter((item) => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={90}
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Monthly Payment Trend
          </h3>
          <div className="space-y-3">
            {monthlyTrend.map((month, index) => {
              const maxAmount = Math.max(...monthlyTrend.map((m) => m.amount), 1);
              const percentage = (month.amount / maxAmount) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{month.month}</span>
                    <span className="text-gray-900 font-semibold">₹{month.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">{month.count} payment{month.count !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">All Payments</h3>
        </div>
        <div className="overflow-x-auto">
          {allPayments.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">No payments yet</h3>
              <p className="text-sm text-gray-500 mb-4">Add your first payment to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
              >
                <Plus className="w-4 h-4" />
                Add First Payment
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {allPayments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => {
                    const member = teamMembers.find((m) => m.id === payment.team_member_id);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                              {member?.name.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{member?.name || "Unknown"}</div>
                              <div className="text-xs text-gray-500">{member?.role || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                          {format(payment.date, "MMM dd, yyyy")}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 max-w-[150px] truncate">
                          {payment.notes || "-"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(payment)}
                              className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded transition"
                              title="Edit Payment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id!)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 relative">
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

            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingPayment ? "Edit Payment" : "Add Payment"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Member *</label>
                <select
                  value={paymentForm.team_member_id}
                  onChange={(e) => {
                    const member = teamMembers.find((m) => m.id === e.target.value);
                    setSelectedMember(member || null);
                    setPaymentForm({ ...paymentForm, team_member_id: e.target.value });
                  }}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
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
                  className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-3 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
