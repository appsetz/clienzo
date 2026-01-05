"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getInvestments, createInvestment, updateInvestment, deleteInvestment, Investment } from "@/lib/firebase/db";
import { Plus, Trash2, Edit2, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type InvestmentFormData = {
  name: string;
  date: string;
  payment_method: "upi" | "cash" | "card";
  amount: string;
  upi_id: string;
  transaction_id: string;
  notes: string;
};

export default function InvestmentsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "upi",
    amount: "",
    upi_id: "",
    transaction_id: "",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if not agency
    if (userProfile && userProfile.userType !== "agency") {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const investmentsData = await getInvestments(user.uid);
      setInvestments(investmentsData);
    } catch (error: any) {
      console.error("Error loading investments:", error);
      setError(error.message || "Failed to load investments");
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

    // Validate payment method fields
    if (formData.payment_method === "upi" && !formData.upi_id.trim()) {
      setError("Please enter UPI ID");
      return;
    }
    if (formData.payment_method === "upi" && !formData.transaction_id.trim()) {
      setError("Please enter Transaction ID for UPI payment");
      return;
    }

    try {
      if (editingInvestment) {
        await updateInvestment(editingInvestment.id!, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          payment_method: formData.payment_method,
          upi_id: formData.payment_method === "upi" ? formData.upi_id : undefined,
          transaction_id: formData.payment_method === "upi" && formData.transaction_id ? formData.transaction_id : undefined,
          notes: formData.notes || undefined,
        });
      } else {
        await createInvestment({
          agency_id: user.uid,
          name: formData.name,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          payment_method: formData.payment_method,
          upi_id: formData.payment_method === "upi" ? formData.upi_id : undefined,
          transaction_id: formData.payment_method === "upi" && formData.transaction_id ? formData.transaction_id : undefined,
          notes: formData.notes || undefined,
        });
      }
      setShowModal(false);
      setEditingInvestment(null);
      setFormData({
        name: "",
        date: format(new Date(), "yyyy-MM-dd"),
        payment_method: "upi",
        amount: "",
        upi_id: "",
        transaction_id: "",
        notes: "",
      });
      loadData();
    } catch (error: any) {
      setError(error.message || "Failed to save investment");
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name || "",
      date: format(investment.date, "yyyy-MM-dd"),
      payment_method: investment.payment_method,
      amount: investment.amount.toString(),
      upi_id: investment.upi_id || "",
      transaction_id: investment.transaction_id || "",
      notes: investment.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (investmentId: string) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;
    try {
      await deleteInvestment(investmentId);
      loadData();
    } catch (error) {
      console.error("Error deleting investment:", error);
      setError("Failed to delete investment");
    }
  };

  if (!userProfile || userProfile.userType !== "agency") {
    return null;
  }

  if (loading && investments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "upi":
        return "UPI";
      case "card":
        return "Card";
      case "cash":
        return "Cash";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Investments</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your agency investments and payments received</p>
          </div>
          <button
            onClick={() => {
              setEditingInvestment(null);
              setFormData({
                name: "",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "upi",
                amount: "",
                upi_id: "",
                transaction_id: "",
                notes: "",
              });
              setShowModal(true);
              setError("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add Investment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalInvested.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{investments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Investment</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{investments.length > 0 ? (totalInvested / investments.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Investments List */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h3>
          <p className="text-sm text-gray-500 mb-5">Start tracking your agency investments by adding your first investment.</p>
          <button
            onClick={() => {
              setEditingInvestment(null);
              setFormData({
                name: "",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "upi",
                amount: "",
                upi_id: "",
                transaction_id: "",
                notes: "",
              });
              setShowModal(true);
              setError("");
            }}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
          >
            Add Investment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {investments.map((investment) => (
                  <tr key={investment.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {investment.name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                      {format(investment.date, "MMM dd, yyyy")}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-[10px] font-medium">
                        {getPaymentMethodLabel(investment.payment_method)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{investment.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <div className="space-y-0.5">
                        {investment.payment_method === "upi" && investment.upi_id && (
                          <div>UPI: {investment.upi_id}</div>
                        )}
                        {investment.payment_method === "card" && (
                          <div>Card</div>
                        )}
                        {investment.payment_method === "cash" && <div>Cash</div>}
                        {investment.transaction_id && (
                          <div className="text-[10px] text-gray-400">Txn: {investment.transaction_id}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 max-w-[120px] truncate">
                      {investment.notes || "-"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(investment)}
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(investment.id!)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingInvestment ? "Edit Investment" : "Add Investment"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name of Investment *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter investment name"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  How did you pay? *
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as "upi" | "cash" | "card" })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                >
                  <option value="upi">UPI</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              {formData.payment_method === "upi" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID *</label>
                    <input
                      type="text"
                      value={formData.upi_id}
                      onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                      placeholder="yourname@upi"
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the UPI ID where you received the payment</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      placeholder="Enter transaction ID"
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the UPI transaction ID</p>
                  </div>
                </>
              )}
              {formData.payment_method === "card" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Card Payment:</strong> No additional details required for debit/credit card payments.
                  </p>
                </div>
              )}
              {formData.payment_method === "cash" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Cash Payment:</strong> No additional details required for cash payments.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  placeholder="Optional notes about this investment..."
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInvestment(null);
                    setFormData({
                      name: "",
                      date: format(new Date(), "yyyy-MM-dd"),
                      payment_method: "upi",
                      amount: "",
                      upi_id: "",
                      transaction_id: "",
                      notes: "",
                    });
                    setError("");
                  }}
                  className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
                >
                  {editingInvestment ? "Update Investment" : "Add Investment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

