"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPayments, createPayment, deletePayment, Payment } from "@/lib/firebase/db";
import { getProjects, Project } from "@/lib/firebase/db";
import { Plus, Trash2, DollarSign, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import { getClient } from "@/lib/firebase/db";
import PageTour from "@/components/PageTour";
import { getPaymentsTourSteps } from "@/lib/tours";

type PaymentFormData = {
  project_id: string;
  amount: string;
  date: string;
  notes: string;
  payment_type: "" | "advance" | "partial" | "final";
};

export default function PaymentsPage() {
  const { user, userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    project_id: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    payment_type: "",
  });
  const [error, setError] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [paymentsData, projectsData] = await Promise.all([
        getPayments(user.uid),
        getProjects(user.uid),
      ]);
      
      console.log("Payments page data loaded:", {
        payments: paymentsData.length,
        projects: projectsData.length,
      });
      
      setPayments(paymentsData);
      setProjects(projectsData);
    } catch (error: any) {
      console.error("Error loading payments data:", error);
      console.error("Error details:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      });
      
      let errorMessage = "Error loading data. ";
      if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
        errorMessage += "Firestore index required. Please create the index using the link in the error message.";
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");

    try {
      await createPayment({
        user_id: user.uid,
        project_id: formData.project_id,
        amount: parseFloat(formData.amount) || 0,
        date: new Date(formData.date),
        notes: formData.notes || undefined,
        payment_type: formData.payment_type || undefined,
      });
      setShowModal(false);
      setFormData({
        project_id: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        payment_type: "",
      });
      loadData();
    } catch (error: any) {
      setError(error.message || "Failed to save payment");
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await deletePayment(paymentId);
      loadData();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const handleGenerateInvoice = async (payment: Payment) => {
    try {
      const project = projects.find((p) => p.id === payment.project_id);
      if (!project) {
        alert("Project not found for this payment");
        return;
      }
      const client = await getClient(project.client_id);
      if (!client) {
        alert("Client not found for this payment");
        return;
      }

      // Get all payments for this project to calculate totals
      const allProjectPayments = payments.filter((p) => p.project_id === payment.project_id);
      const totalPaid = allProjectPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = project.total_amount - totalPaid;

      const invoiceNumber = `INV-${payment.id?.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      setInvoiceData({
        invoiceNumber,
        invoiceDate: new Date(payment.date),
        client,
        project,
        items: [
          {
            description: `Payment for: ${project.name}`,
            amount: payment.amount,
            date: payment.date,
            paymentType: payment.payment_type || "payment",
          },
        ],
        totalAmount: project.total_amount, // Total project amount
        paidAmount: totalPaid, // Total paid from all payments
        pendingAmount: pending, // Remaining amount
        notes: payment.notes,
      });
      setShowInvoice(true);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthPayments = payments.filter((p) => {
    const paymentDate = new Date(p.date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate pending payments per project
  const projectPayments = projects.map((project) => {
    const projectPaymentsList = payments.filter((p) => p.project_id === project.id);
    const paid = projectPaymentsList.reduce((sum, p) => sum + p.amount, 0);
    const pending = project.total_amount - paid;
    return { project, paid, pending };
  });

  const totalPending = projectPayments.reduce((sum, p) => sum + (p.pending > 0 ? p.pending : 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <PageTour pageId="payments" steps={getPaymentsTourSteps()} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-tour="payments-header">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track all your payments</p>
        </div>
        <button
          data-tour="payments-add-button"
          onClick={() => setShowModal(true)}
          disabled={projects.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Payment
        </button>
      </div>

      {projects.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            You need to create projects first.{" "}
            <a href="/projects" className="font-semibold underline">
              Create a project
            </a>
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        {userProfile?.plan !== "free" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">₹{thisMonthTotal.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Payments */}
      {totalPending > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Payments</h2>
          <div className="space-y-3">
            {projectPayments
              .filter((p) => p.pending > 0)
              .map(({ project, paid, pending }) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-600">
                      Paid: ₹{paid.toLocaleString()} / Total: ₹{project.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">₹{pending.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">pending</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-6" data-tour="payments-list">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No payments recorded yet</p>
            <button
              onClick={() => setShowModal(true)}
              disabled={projects.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Your First Payment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Project</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Type</th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell">Notes</th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                      {format(new Date(payment.date), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">{getProjectName(payment.project_id)}</td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                      {payment.payment_type ? (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.payment_type === "advance"
                              ? "bg-blue-100 text-blue-800"
                              : payment.payment_type === "partial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {payment.payment_type === "advance"
                            ? "Advance"
                            : payment.payment_type === "partial"
                            ? "Partial"
                            : "Final"}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 text-right font-semibold whitespace-nowrap">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">{payment.notes || "-"}</td>
                    <td className="py-3 px-2 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          data-tour="payments-invoice-button"
                          onClick={() => handleGenerateInvoice(payment)}
                          className="p-1.5 sm:p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id!)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  value={formData.payment_type}
                  onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as "advance" | "partial" | "final" | "" })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select type (optional)</option>
                  <option value="advance">Advance Payment</option>
                  <option value="partial">Partial Payment</option>
                  <option value="final">Final Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      project_id: "",
                      amount: "",
                      date: format(new Date(), "yyyy-MM-dd"),
                      notes: "",
                      payment_type: "",
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator */}
      <div data-tour="payments-invoice-location">
        <InvoiceGenerator
          isOpen={showInvoice}
          onClose={() => {
            setShowInvoice(false);
            setInvoiceData(null);
          }}
          invoiceData={invoiceData}
        userProfile={userProfile && userProfile.userType !== "business" ? {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          location: userProfile.location,
          bio: userProfile.bio,
          userType: userProfile.userType,
          agencyName: userProfile.agencyName,
          agencyPhone: userProfile.agencyPhone,
          agencyEmail: userProfile.agencyEmail,
          agencyAddress: userProfile.agencyAddress,
          agencyWebsite: userProfile.agencyWebsite,
          agencyDescription: userProfile.agencyDescription,
        } : undefined}
        />
      </div>
    </div>
  );
}

