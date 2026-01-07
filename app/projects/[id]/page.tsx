"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getProject, updateProject, Project } from "@/lib/firebase/db";
import { getClient, Client } from "@/lib/firebase/db";
import { getPayments, Payment, createPayment, deletePayment } from "@/lib/firebase/db";
import { getTeamMembers, TeamMember } from "@/lib/firebase/db";
import { ArrowLeft, Edit2, DollarSign, Calendar, Plus, Trash2, FileText, Users, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import InvoiceGenerator from "@/components/InvoiceGenerator";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectTeamMembers, setProjectTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });
  const [error, setError] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!user || !params.id) return;
    try {
      const projectData = await getProject(params.id as string);
      if (!projectData) {
        router.push("/projects");
        return;
      }
      setProject(projectData);

      const promises: Promise<any>[] = [
        getClient(projectData.client_id),
        getPayments(user.uid, projectData.id),
      ];
      
      // Load team members if user is an agency
      if (userProfile?.userType === "agency") {
        promises.push(getTeamMembers(user.uid));
      }
      
      const results = await Promise.all(promises);
      const [clientData, paymentsData] = results;
      
      setClient(clientData);
      setPayments(paymentsData);
      
      // If agency and project has team members, filter them
      if (userProfile?.userType === "agency" && projectData.team_members && projectData.team_members.length > 0) {
        const allTeamMembers = results[2] || [];
        const assignedMembers = allTeamMembers.filter((member: TeamMember) => 
          projectData.team_members?.includes(member.id!)
        );
        setProjectTeamMembers(assignedMembers);
        setTeamMembers(allTeamMembers);
      } else if (userProfile?.userType === "agency") {
        setTeamMembers(results[2] || []);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, params.id, router]);

  useEffect(() => {
    if (user && params.id) {
      loadData();
    }
  }, [user, params.id, loadData]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    setError("");

    try {
      await createPayment({
        user_id: user.uid,
        project_id: project.id!,
        amount: parseFloat(paymentForm.amount) || 0,
        date: new Date(paymentForm.date),
        notes: paymentForm.notes || undefined,
      });
      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      loadData();
    } catch (error: any) {
      setError(error.message || "Failed to add payment");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await deletePayment(paymentId);
      loadData();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "on-hold":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pending = project.total_amount - totalPaid;
  const progress = (totalPaid / project.total_amount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/projects"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {client && (
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <span className="text-sm">Client:</span>
                    <Link href={`/clients/${client.id}/projects`} className="text-blue-600 hover:text-blue-700 font-medium">
                      {client.name}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)}
                <span className="capitalize">{project.status}</span>
              </span>
              {project.deadline && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">Due: {format(project.deadline, "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
          
          <Link
            href={`/projects?edit=${project.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit Project
          </Link>
        </div>
      </div>

      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Amount</p>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{project.total_amount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Paid Amount</p>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Amount</p>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">₹{pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Progress</h2>
          {client && (
            <button
              onClick={() => {
                const invoiceNumber = `INV-${project.id?.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
                setInvoiceData({
                  invoiceNumber,
                  invoiceDate: new Date(),
                  client,
                  project,
                  items: [
                    {
                      description: `Project: ${project.name}`,
                      amount: project.total_amount,
                    },
                  ],
                  totalAmount: project.total_amount,
                  paidAmount: totalPaid,
                  pendingAmount: pending,
                });
                setShowInvoice(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 via-blue-700 to-blue-400 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              <FileText className="w-4 h-4" />
              Generate Invoice
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-slate-900 via-blue-700 to-blue-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>₹{totalPaid.toLocaleString()} of ₹{project.total_amount.toLocaleString()}</span>
            <span>{pending > 0 ? `₹${pending.toLocaleString()} pending` : "Fully paid"}</span>
          </div>
        </div>
      </div>

      {/* Team Members (Agencies only) */}
      {userProfile?.userType === "agency" && projectTeamMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {projectTeamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-900 via-blue-700 to-blue-400 flex items-center justify-center text-white font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-600">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 via-blue-700 to-blue-400 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-600 mb-6">Start tracking payments for this project</p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-slate-900 via-blue-700 to-blue-400 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Add First Payment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {format(new Date(payment.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-gray-500 mt-2">{payment.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {client && (
                    <button
                      onClick={() => {
                        const allPaymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
                        const remaining = project.total_amount - allPaymentsTotal;
                        
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
                          totalAmount: project.total_amount,
                          paidAmount: allPaymentsTotal,
                          pendingAmount: remaining,
                          notes: payment.notes,
                        });
                        setShowInvoice(true);
                      }}
                      className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                      title="Generate Invoice"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePayment(payment.id!)}
                    className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Delete Payment"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 my-auto max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Payment</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  max={pending > 0 ? pending : undefined}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="0.00"
                />
                {pending > 0 && (
                  <p className="text-xs text-gray-500 mt-1.5">Pending: ₹{pending.toLocaleString()}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                  placeholder="Add any notes about this payment..."
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({
                      amount: "",
                      date: format(new Date(), "yyyy-MM-dd"),
                      notes: "",
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-slate-900 via-blue-700 to-blue-400 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator */}
      {client && (
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
      )}
    </div>
  );
}