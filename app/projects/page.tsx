"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createProject, updateProject, deleteProject, Project, getTeamMembers, TeamMember, getPayments } from "@/lib/firebase/db";
import { getClients, Client, Payment } from "@/lib/firebase/db";
import { Plus, Edit2, Trash2, Calendar, DollarSign, FolderKanban, Users, Search, Download } from "lucide-react";
import { checkProjectLimit, getPlanLimits } from "@/lib/plan-limits";
import { format } from "date-fns";
import Link from "next/link";
import { triggerEmailEvent } from "@/lib/email/service";
import { exportToCSV } from "@/lib/utils/exportData";

export default function ProjectsPage() {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    status: "active" as Project["status"],
    deadline: "",
    total_amount: "",
    reminder_date: "",
    completed_date: "",
    team_members: [] as string[],
  });
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project);
    setFormData({
      client_id: project.client_id,
      name: project.name,
      status: project.status,
      deadline: project.deadline ? format(project.deadline, "yyyy-MM-dd") : "",
      total_amount: project.total_amount.toString(),
      reminder_date: project.reminder_date ? format(project.reminder_date, "yyyy-MM-dd") : "",
      completed_date: project.completed_date ? format(project.completed_date, "yyyy-MM-dd") : "",
      team_members: project.team_members || [],
    });
    setShowModal(true);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        getProjects(user.uid),
        getClients(user.uid),
        getPayments(user.uid),
      ];
      
      // Load team members if user is an agency
      if (userProfile?.userType === "agency") {
        promises.push(getTeamMembers(user.uid));
      }
      
      const results = await Promise.all(promises);
      const [projectsData, clientsData, paymentsData] = results;
      
      if (userProfile?.userType === "agency") {
        setTeamMembers(results[3] || []);
      }
      
      console.log("Projects page data loaded:", {
        projects: projectsData.length,
        clients: clientsData.length,
        payments: paymentsData.length,
        teamMembers: userProfile?.userType === "agency" ? results[3]?.length : 0,
      });
      
      setProjects(projectsData);
      setClients(clientsData);
      setPayments(paymentsData);
      
      // Check for edit query param after loading
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get("edit");
        if (editId) {
          const project = projectsData.find((p: Project) => p.id === editId);
          if (project) {
            handleEdit(project);
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading projects data:", error);
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
  }, [user, userProfile, handleEdit]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      // Check for client query param
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get("client");
      if (clientId) {
        setFormData((prev) => ({ ...prev, client_id: clientId }));
        setShowModal(true);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    setError("");
    setSubmitting(true);

    // All features are now available to everyone - no limits

    try {
      const projectData: any = {
        user_id: user.uid,
        client_id: formData.client_id,
        name: formData.name,
        status: formData.status,
        total_amount: parseFloat(formData.total_amount) || 0,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        reminder_date: formData.reminder_date ? new Date(formData.reminder_date) : undefined,
        completed_date: formData.status === "completed" && formData.completed_date ? new Date(formData.completed_date) : undefined,
      };
      
      // Only include team_members for agencies with selected members
      if (userProfile?.userType === "agency" && formData.team_members && formData.team_members.length > 0) {
        projectData.team_members = formData.team_members;
      }

      const projectClient = clients.find((c) => c.id === projectData.client_id);
      
      if (editingProject) {
        const oldStatus = editingProject.status;
        await updateProject(editingProject.id!, projectData);
        
        // Trigger email events for status changes (agency only)
        if (user && userProfile?.userType === "agency" && projectClient && projectClient.email) {
          try {
            // Project completed
            if (oldStatus !== "completed" && projectData.status === "completed") {
              await triggerEmailEvent(
                user.uid,
                "PROJECT_COMPLETED",
                {
                  agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                  client_name: projectClient.name,
                  project_name: projectData.name,
                },
                projectClient.email
              );
              // Process queue immediately to send email instantly
              try {
                await fetch("/api/email/process-queue", { method: "GET" });
              } catch (queueError) {
                console.error("Error processing email queue:", queueError);
              }
            }
            // Project started (status changed to active)
            else if (oldStatus === "on-hold" && projectData.status === "active") {
              await triggerEmailEvent(
                user.uid,
                "PROJECT_STARTED",
                {
                  agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                  client_name: projectClient.name,
                  project_name: projectData.name,
                },
                projectClient.email
              );
              // Process queue immediately to send email instantly
              try {
                await fetch("/api/email/process-queue", { method: "GET" });
              } catch (queueError) {
                console.error("Error processing email queue:", queueError);
              }
            }
            // Project put on hold
            else if (oldStatus !== "on-hold" && projectData.status === "on-hold") {
              await triggerEmailEvent(
                user.uid,
                "PROJECT_ON_HOLD",
                {
                  agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                  client_name: projectClient.name,
                  project_name: projectData.name,
                },
                projectClient.email
              );
              // Process queue immediately to send email instantly
              try {
                await fetch("/api/email/process-queue", { method: "GET" });
              } catch (queueError) {
                console.error("Error processing email queue:", queueError);
              }
            }
          } catch (emailError) {
            console.error("Error triggering email event:", emailError);
          }
        }
      } else {
        await createProject(projectData);
        
        // Trigger email event for new project (agency only)
        if (user && userProfile?.userType === "agency" && projectClient && projectClient.email) {
          try {
            if (projectData.status === "active") {
              await triggerEmailEvent(
                user.uid,
                "PROJECT_STARTED",
                {
                  agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                  client_name: projectClient.name,
                  project_name: projectData.name,
                },
                projectClient.email
              );
            } else if (projectData.status === "on-hold") {
              await triggerEmailEvent(
                user.uid,
                "PROJECT_ON_HOLD",
                {
                  agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                  client_name: projectClient.name,
                  project_name: projectData.name,
                },
                projectClient.email
              );
            } else if (projectData.status === "completed") {
              await triggerEmailEvent(
                user.uid,
                "PROJECT_COMPLETED",
                {
                  agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
                  client_name: projectClient.name,
                  project_name: projectData.name,
                },
                projectClient.email
              );
            }
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
      setEditingProject(null);
      setFormData({
        client_id: "",
        name: "",
        status: "active",
        deadline: "",
        total_amount: "",
        reminder_date: "",
        completed_date: "",
        team_members: [],
      });
      loadData();
    } catch (error: any) {
      setError(error.message || "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(projectId);
      loadData();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleExport = () => {
    const exportData = projects.map((project) => {
      const projectClient = clients.find((c) => c.id === project.client_id);
      const projectPayments = payments.filter((p) => p.project_id === project.id);
      const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = project.total_amount - totalPaid;
      
      return {
        "Project Name": project.name,
        "Client Name": projectClient?.name || "",
        "Status": project.status,
        "Total Amount (₹)": project.total_amount.toLocaleString(),
        "Paid Amount (₹)": totalPaid.toLocaleString(),
        "Pending Amount (₹)": pending.toLocaleString(),
        "Deadline": project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : "",
        "Created Date": project.createdAt ? format(new Date(project.createdAt), "MMM dd, yyyy") : "",
      };
    });
    
    exportToCSV(exportData, "projects");
  };

  const limits = userProfile ? getPlanLimits(userProfile.plan) : getPlanLimits("free");
  const activeProjects = projects.filter((p) => p.status === "active");
  const canAddMore = activeProjects.length < limits.maxProjects;

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((project) => {
      const client = clients.find((c) => c.id === project.client_id);
      const clientName = client?.name || "";
      return (
        project.name.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query)
      );
    });
  }, [projects, clients, searchQuery]);

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
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
              {limits.maxProjects !== Infinity && ` (${limits.maxProjects} active limit)`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition w-56 text-gray-900"
              />
            </div>
            <button
              onClick={() => {
                setEditingProject(null);
                setFormData({
                  client_id: "",
                  name: "",
                  status: "active",
                  deadline: "",
                  total_amount: "",
                  reminder_date: "",
                  completed_date: "",
                  team_members: [],
                });
                setShowModal(true);
              }}
              disabled={!canAddMore && clients.length > 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>
        </div>
      </div>

      {!canAddMore && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
          <p className="text-orange-800">
            All features are now available to everyone.
          </p>
        </div>
      )}

      {clients.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="text-blue-800">
            You need to add clients first.{" "}
            <Link href="/clients" className="font-medium underline">
              Add a client
            </Link>
          </p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-5">Start by creating your first project</p>
          <button
            onClick={() => setShowModal(true)}
            disabled={clients.length === 0}
            className="px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.length === 0 && searchQuery ? (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
            const client = clients.find((c) => c.id === project.client_id);
            return (
              <div key={project.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
                    {client && (
                      <p className="text-xs text-gray-500 mt-0.5">Client: {client.name}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-medium shrink-0 ml-2 ${
                      project.status === "active"
                        ? "bg-green-100 text-green-700"
                        : project.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : project.status === "on-hold"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">₹{project.total_amount.toLocaleString()}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{format(project.deadline, "MMM dd, yyyy")}</span>
                    </div>
                  )}
                </div>
                {/* Show team members if agency and project has team members */}
                {userProfile?.userType === "agency" && project.team_members && project.team_members.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <div className="flex items-center gap-1 flex-wrap">
                      {project.team_members.slice(0, 2).map((memberId) => {
                        const member = teamMembers.find((m) => m.id === memberId);
                        if (!member) return null;
                        return (
                          <div
                            key={memberId}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 rounded text-[10px]"
                          >
                            <div className="h-4 w-4 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium text-[8px]">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-700">{member.name}</span>
                          </div>
                        );
                      })}
                      {project.team_members.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{project.team_members.length - 2}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-3 py-2 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium hover:bg-teal-100 transition"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id!)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 my-auto max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Project["status"];
                    setFormData({ 
                      ...formData, 
                      status: newStatus,
                      completed_date: newStatus === "completed" ? formData.completed_date : ""
                    });
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {formData.status === "completed" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date *</label>
                  <input
                    type="date"
                    value={formData.completed_date}
                    onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Select when the project was completed</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                />
              </div>
              
              {/* Team Member Selection (Agencies only) */}
              {userProfile?.userType === "agency" && teamMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Members Managing This Project (Select up to 3)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {teamMembers.map((member) => {
                      const teamMembersArray = formData.team_members || [];
                      const isSelected = teamMembersArray.includes(member.id!);
                      const isDisabled = !isSelected && teamMembersArray.length >= 3;
                      
                      return (
                        <label
                          key={member.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? "bg-purple-50 border-2 border-purple-500"
                              : isDisabled
                              ? "bg-gray-50 opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentTeamMembers = formData.team_members || [];
                              if (e.target.checked) {
                                if (currentTeamMembers.length < 3) {
                                  setFormData({
                                    ...formData,
                                    team_members: [...currentTeamMembers, member.id!],
                                  });
                                }
                              } else {
                                setFormData({
                                  ...formData,
                                  team_members: currentTeamMembers.filter((id) => id !== member.id),
                                });
                              }
                            }}
                            disabled={isDisabled && !isSelected}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.team_members || []).length}/3 members selected
                  </p>
                </div>
              )}
              
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
                    setEditingProject(null);
                    setFormData({
                      client_id: "",
                      name: "",
                      status: "active",
                      deadline: "",
                      total_amount: "",
                      reminder_date: "",
                      completed_date: "",
                      team_members: [],
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingProject ? "Updating..." : "Adding...") : (editingProject ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

