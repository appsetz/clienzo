"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  TeamMember,
  getTeamMemberPayments,
  createTeamMemberPayment,
  deleteTeamMemberPayment,
  TeamMemberPayment,
} from "@/lib/firebase/db";
import { Plus, Edit2, Trash2, Mail, User, X, Save, DollarSign, Calendar, ChevronDown, ChevronUp, Download } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import Link from "next/link";
import { exportToCSV } from "@/lib/utils/exportData";

export default function TeamPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberPayments, setMemberPayments] = useState<{ [key: string]: TeamMemberPayment[] }>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<TeamMember | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  // Redirect if not an agency
  useEffect(() => {
    if (userProfile && userProfile.userType !== "agency") {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const loadTeamMembers = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTeamMembers(user.uid);
      setTeamMembers(data);
      
      // Load payments for all members
      const paymentsMap: { [key: string]: TeamMemberPayment[] } = {};
      for (const member of data) {
        if (member.id) {
          try {
            const payments = await getTeamMemberPayments(user.uid, member.id);
            paymentsMap[member.id] = payments;
          } catch (err) {
            console.error(`Error loading payments for member ${member.id}:`, err);
            paymentsMap[member.id] = [];
          }
        }
      }
      setMemberPayments(paymentsMap);
    } catch (error: any) {
      console.error("Error loading team members:", error);
      if (error?.message?.includes("index")) {
        setError("Index is building. Please wait a few minutes and refresh the page.");
      } else {
        setError(error.message || "Error loading team members");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && userProfile?.userType === "agency") {
      loadTeamMembers();
    }
  }, [user, userProfile, loadTeamMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    try {
      if (editingMember) {
        // Update existing member
        await updateTeamMember(editingMember.id!, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      } else {
        // Create new member
        await createTeamMember({
          agency_id: user.uid,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      }
      setShowModal(false);
      setEditingMember(null);
      setFormData({ name: "", email: "", role: "" });
      loadTeamMembers();
    } catch (err: any) {
      setError(err.message || "Failed to save team member");
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      await deleteTeamMember(memberId);
      loadTeamMembers();
    } catch (err: any) {
      setError(err.message || "Failed to delete team member");
    }
  };

  const handleExport = () => {
    const exportData = teamMembers.map((member) => {
      const payments = memberPayments[member.id || ""] || [];
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        "Staff Name": member.name,
        "Email": member.email,
        "Role": member.role,
        "Total Payments (₹)": totalPayments.toLocaleString(),
        "Number of Payments": payments.length,
        "Created Date": member.createdAt ? format(new Date(member.createdAt), "MMM dd, yyyy") : "",
      };
    });
    
    exportToCSV(exportData, "team_staff");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData({ name: "", email: "", role: "" });
    setError("");
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMemberForPayment) return;

    setError("");
    try {
      await createTeamMemberPayment({
        agency_id: user.uid,
        team_member_id: selectedMemberForPayment.id!,
        amount: parseFloat(paymentForm.amount) || 0,
        date: new Date(paymentForm.date),
        notes: paymentForm.notes || undefined,
      });
      setShowPaymentModal(false);
      setSelectedMemberForPayment(null);
      setPaymentForm({ amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
      await loadTeamMembers();
    } catch (err: any) {
      setError(err.message || "Failed to add payment");
    }
  };

  const handleDeletePayment = async (paymentId: string, memberId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await deleteTeamMemberPayment(paymentId);
      await loadTeamMembers();
    } catch (err: any) {
      setError(err.message || "Failed to delete payment");
    }
  };

  const toggleMemberDropdown = (memberId: string) => {
    setExpandedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const getLast6MonthsSalary = (memberId: string) => {
    const payments = memberPayments[memberId] || [];
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(now),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });
      const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      return {
        month: format(month, "MMM yyyy"),
        total,
        count: monthPayments.length,
      };
    }).reverse(); // Most recent first
  };

  if (userProfile?.userType !== "agency") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Team management is only available for agencies.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">My Staff</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your agency staff</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              disabled={teamMembers.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/team/payments"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition"
            >
              <DollarSign className="w-4 h-4" />
              <span>Payments</span>
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-600 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <User className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No team members yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Add your first team member to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
          >
            <Plus className="w-5 h-5" />
            Add First Member
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <React.Fragment key={member.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {member.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹{((memberPayments[member.id!] || []).reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedMemberForPayment(member);
                                setPaymentForm({
                                  amount: "",
                                  date: format(new Date(), "yyyy-MM-dd"),
                                  notes: "",
                                });
                                setShowPaymentModal(true);
                              }}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                              title="Add Payment"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(member.createdAt, "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleMemberDropdown(member.id!)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="View Salary Details"
                            >
                              {expandedMembers.has(member.id!) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 text-teal-600 hover:text-purple-700 hover:bg-teal-50 rounded-lg transition"
                              title="Edit Member"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id!)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Last 6 Months Salary Dropdown */}
                      {expandedMembers.has(member.id!) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">Last 6 Months Salary</h4>
                                <Link
                                  href={`/team/payments?member=${member.id}`}
                                  className="text-xs sm:text-sm text-teal-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                >
                                  View More
                                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                                </Link>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {getLast6MonthsSalary(member.id!).map((monthData, index) => (
                                  <div
                                    key={index}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs sm:text-sm font-medium text-gray-700">{monthData.month}</span>
                                      <span className="text-xs text-gray-500">{monthData.count} payment{monthData.count !== 1 ? "s" : ""}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-5 h-5 text-green-600" />
                                      <span className="text-lg sm:text-xl font-bold text-gray-900">
                                        ₹{monthData.total.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">Total (6 Months)</span>
                                  <span className="text-base sm:text-lg font-bold text-gray-900">
                                    ₹{getLast6MonthsSalary(member.id!).reduce((sum, m) => sum + m.total, 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4">
                  {/* Header with Name and Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{member.name}</div>
                        <div className="text-xs text-gray-500 truncate">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 text-teal-600 hover:text-purple-700 hover:bg-teal-50 rounded-lg transition"
                        title="Edit Member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id!)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Delete Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {member.role}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Added:</span>
                      <span className="font-medium text-gray-900">{format(member.createdAt, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{((memberPayments[member.id!] || []).reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedMemberForPayment(member);
                        setPaymentForm({
                          amount: "",
                          date: format(new Date(), "yyyy-MM-dd"),
                          notes: "",
                        });
                        setShowPaymentModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition"
                      title="Add Payment"
                    >
                      <Plus className="w-4 h-4" />
                      Payment
                    </button>
                    <button
                      onClick={() => toggleMemberDropdown(member.id!)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition"
                      title="View Salary Details"
                    >
                      {expandedMembers.has(member.id!) ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Salary
                        </>
                      )}
                    </button>
                  </div>

                  {/* Last 6 Months Salary Dropdown */}
                  {expandedMembers.has(member.id!) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Last 6 Months Salary</h4>
                      <div className="space-y-2">
                        {getLast6MonthsSalary(member.id!).map((monthData, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700">{monthData.month}</span>
                              <span className="text-gray-600">{monthData.count} payment{monthData.count !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-bold text-gray-900">
                                ₹{monthData.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Total (6 Months)</span>
                        <span className="font-bold text-gray-900">
                          ₹{getLast6MonthsSalary(member.id!).reduce((sum, m) => sum + m.total, 0).toLocaleString()}
                        </span>
                      </div>
                      <Link
                        href={`/team/payments?member=${member.id}`}
                        className="block text-center mt-3 text-xs text-teal-600 hover:text-purple-700 font-medium"
                      >
                        View All Payments →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedMemberForPayment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedMemberForPayment(null);
                setPaymentForm({ amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pr-8">
              Add Payment for {selectedMemberForPayment.name}
            </h2>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:border-transparent text-gray-900 text-base"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:border-transparent text-gray-900 text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:border-transparent text-gray-900 text-base"
                  placeholder="Payment notes..."
                />
              </div>

              {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedMemberForPayment(null);
                    setPaymentForm({ amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-600 transition"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 pr-8">
              {editingMember ? "Edit Team Member" : "Add Team Member"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:border-transparent text-gray-900 text-base"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:border-transparent text-gray-900 text-base"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:border-transparent text-gray-900 text-base"
                  placeholder="Developer, Designer, Manager, etc."
                />
              </div>

              {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-600 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingMember ? "Update" : "Add"} Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

