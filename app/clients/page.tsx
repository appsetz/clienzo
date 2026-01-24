"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, createClient, updateClient, deleteClient, Client } from "@/lib/firebase/db";
import { Plus, Edit2, Trash2, Mail, Phone, User, Search, Download, ChevronRight } from "lucide-react";
import { checkClientLimit, getPlanLimits } from "@/lib/plan-limits";
import Link from "next/link";
import { getPayments, getProjects, Payment, Project } from "@/lib/firebase/db";
import { triggerEmailEvent } from "@/lib/email/service";
import { exportToCSV } from "@/lib/utils/exportData";
import { format } from "date-fns";

export default function ClientsPage() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadClients = useCallback(async () => {
    if (!user) return;
    try {
      const [clientsData, paymentsData, projectsData] = await Promise.all([
        getClients(user.uid),
        userProfile?.userType === "agency" ? getPayments(user.uid) : Promise.resolve([]),
        userProfile?.userType === "agency" ? getProjects(user.uid) : Promise.resolve([]),
      ]);
      setClients(clientsData);
      setPayments(paymentsData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user, loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    setError("");
    setSubmitting(true);

    try {
      if (editingClient) {
        await updateClient(editingClient.id!, formData);
      } else {
        await createClient({
          user_id: user.uid,
          ...formData,
        });

        if (user && userProfile?.userType === "agency" && formData.email) {
          try {
            await triggerEmailEvent(
              user.uid,
              "CLIENT_CREATED",
              {
                agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                client_name: formData.name,
              },
              formData.email
            );
            // Process queue immediately to send email instantly
            try {
              await fetch("/api/email/process-queue", { method: "GET" });
            } catch (queueError) {
              console.error("Error processing email queue:", queueError);
            }
          } catch (emailError) {
            console.error("Error triggering email event:", emailError);
          }
        }
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData({ name: "", email: "", phone: "", notes: "" });
      loadClients();
    } catch (error: any) {
      setError(error.message || "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await deleteClient(clientId);
      loadClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleExport = () => {
    const exportData = clients.map((client) => {
      const clientProjects = projects.filter((p) => p.client_id === client.id);
      const clientPayments = payments.filter((p) => {
        const paymentProject = projects.find((pr) => pr.id === p.project_id);
        return paymentProject?.client_id === client.id;
      });
      const totalRevenue = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        "Client Name": client.name,
        "Email": client.email || "",
        "Phone": client.phone || "",
        "Total Projects": clientProjects.length,
        "Total Revenue (₹)": totalRevenue.toLocaleString(),
        "Notes": client.notes || "",
        "Created Date": client.createdAt ? format(new Date(client.createdAt), "MMM dd, yyyy") : "",
      };
    });
    
    exportToCSV(exportData, "clients");
  };

  const limits = userProfile ? getPlanLimits(userProfile.plan) : getPlanLimits("free");
  const canAddMore = clients.length < limits.maxClients;

  // Filter clients based on search
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  // Calculate client revenue
  const getClientRevenue = (clientId: string) => {
    const clientProjects = projects.filter((p) => p.client_id === clientId);
    const clientPayments = payments.filter((p) =>
      clientProjects.some((proj) => proj.id === p.project_id)
    );
    return clientPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your {clients.length} {clients.length === 1 ? "client" : "clients"}
            </p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 w-full lg:w-auto">
            {/* Search - Responsive */}
            <div className="relative w-full lg:w-56">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lg:w-56 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900"
              />
              
              {/* Mobile Search Results Dropdown */}
              {searchQuery && filteredClients.length > 0 && (
                <div className="lg:hidden absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredClients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      {client.email && <p className="text-xs text-gray-500">{client.email}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExport}
                disabled={clients.length === 0}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Export CSV</span>
              </button>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setFormData({ name: "", email: "", phone: "", notes: "" });
                  setShowModal(true);
                }}
                disabled={!canAddMore}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Add Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">With Email</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter((c) => c.email).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">With Phone</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter((c) => c.phone).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter((c) => {
                  const createdDate = new Date(c.createdAt);
                  const now = new Date();
                  return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Grid/Table */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? "No clients found" : "No clients yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            {searchQuery ? "Try adjusting your search" : "Start by adding your first client"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
            >
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Projects</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Revenue</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const clientProjectCount = projects.filter((p) => p.client_id === client.id).length;
                  const clientRevenue = getClientRevenue(client.id!);
                  return (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/clients/${client.id}/projects`}
                              className="text-sm font-medium text-gray-900 hover:text-teal-600 transition"
                            >
                              {client.name}
                            </Link>
                            {client.notes && (
                              <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{client.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {clientProjectCount} project{clientProjectCount !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{clientRevenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/clients/${client.id}/projects`}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title="View Projects"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id!)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
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
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 my-auto max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingClient ? "Edit Client" : "Add New Client"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm resize-none"
                  placeholder="Additional notes about the client"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
                    setFormData({ name: "", email: "", phone: "", notes: "" });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingClient ? "Updating..." : "Adding...") : (editingClient ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
