"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { AutomationRule, EmailEvent } from "@/lib/email/types";
import { getEmailTemplates, getEmailSettings } from "@/lib/email/service";
import { defaultTemplates } from "@/lib/email/templates";
import { Save, X, ToggleLeft, ToggleRight } from "lucide-react";

export default function AutomationRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<AutomationRule>>({
    event: "CLIENT_CREATED",
    templateId: "",
    delay: 0,
    enabled: true,
  });

  useEffect(() => {
    if (user) {
      loadRules();
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRules = async () => {
    if (!user) return;
    try {
      // Check if email automation is enabled
      const settings = await getEmailSettings(user.uid);
      if (settings?.enabled) {
        // Ensure templates and rules exist and are enabled
        await ensureRulesExistAndEnabled();
      }

      const q = query(collection(db, "automation_rules"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as AutomationRule[];
      setRules(loaded);
    } catch (error) {
      console.error("Error loading rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const ensureRulesExistAndEnabled = async () => {
    if (!user) return;

    try {
      // Check if templates exist, create if not
      const templatesSnapshot = await getDocs(
        query(collection(db, "email_templates"), where("userId", "==", user.uid))
      );

      if (templatesSnapshot.empty) {
        const now = new Date();
        const templatePromises = defaultTemplates.map((template) =>
          addDoc(collection(db, "email_templates"), {
            ...template,
            userId: user.uid,
            createdAt: now,
            updatedAt: now,
          })
        );
        await Promise.all(templatePromises);
      }

      // Reload templates to get their IDs
      const templatesSnapshotAfter = await getDocs(
        query(collection(db, "email_templates"), where("userId", "==", user.uid))
      );
      const templates = templatesSnapshotAfter.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Check existing rules
      const rulesSnapshot = await getDocs(
        query(collection(db, "automation_rules"), where("userId", "==", user.uid))
      );
      const existingRules = rulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; event?: string; enabled?: boolean; [key: string]: any }>;

      const eventsToCreateRules: EmailEvent[] = [
        "CLIENT_CREATED",
        "PROJECT_STARTED",
        "PROJECT_COMPLETED",
        "PROJECT_ON_HOLD",
        "INVOICE_CREATED",
        "PAYMENT_RECEIVED",
      ];

      // Create or enable rules
      const rulePromises = eventsToCreateRules.map(async (event) => {
        const template = templates.find((t: any) => t.event === event);
        if (!template) return Promise.resolve();

        const existingRule = existingRules.find((r: any) => r.event === event);
        
        if (existingRule) {
          // Enable existing rule if it's disabled
          if (!existingRule.enabled) {
            return updateDoc(doc(db, "automation_rules", existingRule.id), {
              enabled: true,
            });
          }
        } else {
          // Create new rule if it doesn't exist
          return addDoc(collection(db, "automation_rules"), {
            userId: user.uid,
            event,
            templateId: template.id,
            delay: 0,
            enabled: true,
            createdAt: new Date(),
          });
        }
        return Promise.resolve();
      });

      await Promise.all(rulePromises);
    } catch (error) {
      console.error("Error ensuring rules exist and enabled:", error);
    }
  };

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const loaded = await getEmailTemplates(user.uid);
      setTemplates(loaded);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !formData.templateId) return;

    try {
      const ruleData = {
        ...formData,
        userId: user.uid,
      };

      // Only allow creating new rules, not editing existing ones
      await addDoc(collection(db, "automation_rules"), {
        ...ruleData,
        createdAt: new Date(),
      });

      setShowForm(false);
      setFormData({ event: "CLIENT_CREATED", templateId: "", delay: 0, enabled: true });
      await loadRules();
    } catch (error: any) {
      console.error("Error saving rule:", error);
      alert("Failed to save rule: " + error.message);
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "automation_rules", rule.id), {
        enabled: !rule.enabled,
      });
      await loadRules();
    } catch (error: any) {
      console.error("Error toggling rule:", error);
      alert("Failed to toggle rule: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const eventLabels: Record<EmailEvent, string> = {
    CLIENT_CREATED: "Client Created",
    PROJECT_STARTED: "Project Started",
    PROJECT_COMPLETED: "Project Completed",
    PROJECT_ON_HOLD: "Project On Hold",
    INVOICE_CREATED: "Invoice Created",
    INVOICE_OVERDUE: "Invoice Overdue",
    PAYMENT_RECEIVED: "Payment Received",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Automation Rules</h2>
          <p className="text-xs text-gray-500 mt-0.5">Rules are automatically created when you enable email automation</p>
        </div>
      </div>

      {/* Rule Form - Removed - Rules are created automatically */}
      {false && showForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New Automation Rule</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">When (Event)</label>
              <select
                value={formData.event || "CLIENT_CREATED"}
                onChange={(e) => setFormData({ ...formData, event: e.target.value as EmailEvent })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              >
                {Object.entries(eventLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email Template</label>
              <select
                value={formData.templateId || ""}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Delay (minutes)</label>
              <input
                type="number"
                value={formData.delay || 0}
                onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">0 = send immediately</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!formData.templateId}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Rule
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-600">No automation rules configured yet.</p>
            <p className="text-xs text-gray-400 mt-1">Enable email automation in Settings to automatically create rules.</p>
          </div>
        ) : (
          rules.map((rule) => {
            const template = templates.find((t) => t.id === rule.templateId);
            return (
              <div key={rule.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-medium text-gray-900">{eventLabels[rule.event]}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          rule.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Template: <span className="font-medium text-gray-700">{template?.name || "Unknown"}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Delay: <span className="font-medium text-gray-700">{rule.delay} minutes</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`p-1.5 rounded-lg transition ${
                      rule.enabled
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                    title={rule.enabled ? "Disable rule" : "Enable rule"}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

