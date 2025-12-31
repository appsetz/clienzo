"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createProject, updateProject, deleteProject, Project, getTeamMembers, TeamMember } from "@/lib/firebase/db";
import { getClients, Client } from "@/lib/firebase/db";
import { Plus, Edit2, Trash2, Calendar, DollarSign, FolderKanban, Users } from "lucide-react";
import { checkProjectLimit, getPlanLimits } from "@/lib/plan-limits";
import { format } from "date-fns";
import Link from "next/link";

export default function ProjectsPage() {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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
      ];
      
      // Load team members if user is an agency
      if (userProfile?.userType === "agency") {
        promises.push(getTeamMembers(user.uid));
      }
      
      const results = await Promise.all(promises);
      const [projectsData, clientsData] = results;
      
      if (userProfile?.userType === "agency") {
        setTeamMembers(results[2] || []);
      }
      
      console.log("Projects page data loaded:", {
        projects: projectsData.length,
        clients: clientsData.length,
        teamMembers: userProfile?.userType === "agency" ? results[2]?.length : 0,
      });
      
      setProjects(projectsData);
      setClients(clientsData);
      
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
    if (!user) return;

    setError("");

    // All features are now available to everyone - no limits

    try {
      const projectData = {
        user_id: user.uid,
        client_id: formData.client_id,
        name: formData.name,
        status: formData.status,
        total_amount: parseFloat(formData.total_amount) || 0,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        reminder_date: formData.reminder_date ? new Date(formData.reminder_date) : undefined,
        completed_date: formData.status === "completed" && formData.completed_date ? new Date(formData.completed_date) : undefined,
        team_members: userProfile?.userType === "agency" && (formData.team_members || []).length > 0 ? formData.team_members : undefined,
      };

      if (editingProject) {
        await updateProject(editingProject.id!, projectData);
      } else {
        await createProject(projectData);
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

  const limits = userProfile ? getPlanLimits(userProfile.plan) : getPlanLimits("free");
  const activeProjects = projects.filter((p) => p.status === "active");
  const canAddMore = activeProjects.length < limits.maxProjects;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
            {limits.maxProjects !== Infinity && ` (${limits.maxProjects} active limit)`}
          </p>
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
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Project
        </button>
      </div>

      {!canAddMore && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800">
            All features are now available to everyone.
          </p>
        </div>
      )}

      {clients.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            You need to add clients first.{" "}
            <Link href="/clients" className="font-semibold underline">
              Add a client
            </Link>
          </p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Start by creating your first project</p>
          <button
            onClick={() => setShowModal(true)}
            disabled={clients.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.map((project) => {
            const client = clients.find((c) => c.id === project.client_id);
            return (
              <div key={project.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                    {client && (
                      <p className="text-sm text-gray-600 mb-2">Client: {client.name}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{project.total_amount.toLocaleString()}</span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(project.deadline, "MMM dd, yyyy")}</span>
                        </div>
                      )}
                    </div>
                    {/* Show team members if agency and project has team members */}
                    {userProfile?.userType === "agency" && project.team_members && project.team_members.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <div className="flex items-center gap-1 flex-wrap">
                          {project.team_members.slice(0, 3).map((memberId) => {
                            const member = teamMembers.find((m) => m.id === memberId);
                            if (!member) return null;
                            return (
                              <div
                                key={memberId}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs"
                              >
                                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-gray-700 font-medium">{member.name}</span>
                              </div>
                            );
                          })}
                          {project.team_members.length > 3 && (
                            <span className="text-xs text-gray-500">+{project.team_members.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : project.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-4 py-2 bg-purple-50 text-purple-600 rounded-lg font-medium hover:bg-purple-100 transition"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id!)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              {/* Team Member Selection (Agencies only) */}
              {userProfile?.userType === "agency" && teamMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Members Managing This Project (Select up to 3)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

