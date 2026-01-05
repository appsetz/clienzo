"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { EmailTemplate, EmailEvent } from "@/lib/email/types";
import { defaultTemplates } from "@/lib/email/templates";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

export default function EmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    name: "",
    subject: "",
    body: "",
    event: "CLIENT_CREATED",
    variables: [],
  });

  useEffect(() => {
    if (user) loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "email_templates"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as EmailTemplate[];

      // If no templates, initialize with defaults
      if (loaded.length === 0) {
        await initializeDefaultTemplates();
        await loadTemplates();
        return;
      }

      setTemplates(loaded);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultTemplates = async () => {
    if (!user) return;
    const now = new Date();
    for (const template of defaultTemplates) {
      await addDoc(collection(db, "email_templates"), {
        ...template,
        userId: user.uid,
        createdAt: now,
        updatedAt: now,
      });
    }
  };

  const handleSave = async () => {
    if (!user || !formData.name || !formData.subject || !formData.body) return;

    try {
      const templateData = {
        ...formData,
        userId: user.uid,
        updatedAt: new Date(),
      };

      if (editing) {
        await updateDoc(doc(db, "email_templates", editing), templateData);
      } else {
        await addDoc(collection(db, "email_templates"), {
          ...templateData,
          createdAt: new Date(),
        });
      }

      setShowForm(false);
      setEditing(null);
      setFormData({ name: "", subject: "", body: "", event: "CLIENT_CREATED", variables: [] });
      await loadTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert("Failed to save template: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteDoc(doc(db, "email_templates", id));
      await loadTemplates();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template: " + error.message);
    }
  };

  const startEdit = (template: EmailTemplate) => {
    setEditing(template.id);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      event: template.event,
      variables: template.variables,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Email Templates</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your email templates</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ name: "", subject: "", body: "", event: "CLIENT_CREATED", variables: [] });
          }}
          className="flex items-center gap-2 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template Form */}
      {showForm && (
        <div className="border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{editing ? "Edit Template" : "New Template"}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                placeholder="Welcome Email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Event</label>
              <select
                value={formData.event || "CLIENT_CREATED"}
                onChange={(e) => setFormData({ ...formData, event: e.target.value as EmailEvent })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
              >
                <option value="CLIENT_CREATED">Client Created</option>
                <option value="PROJECT_STARTED">Project Started</option>
                <option value="PROJECT_COMPLETED">Project Completed</option>
                <option value="PROJECT_ON_HOLD">Project On Hold</option>
                <option value="INVOICE_CREATED">Invoice Created</option>
                <option value="INVOICE_OVERDUE">Invoice Overdue</option>
                <option value="PAYMENT_RECEIVED">Payment Received</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <input
                type="text"
                value={formData.subject || ""}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                placeholder="Welcome to {{agency_name}}!"
              />
              <p className="text-[10px] text-gray-500 mt-1">Use variables like {"{{client_name}}"}, {"{{project_name}}"}, etc.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Body (HTML)</label>
              <textarea
                value={formData.body || ""}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition font-mono text-xs text-gray-900"
                placeholder="<div>Your HTML email content here...</div>"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
              >
                <Save className="w-4 h-4" />
                Save Template
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <div key={template.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Event: {template.event.replace(/_/g, " ")}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(template)}
                  className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 mb-1">Subject:</p>
              <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">{template.subject}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

