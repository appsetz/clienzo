"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, query, where } from "firebase/firestore";
import { Save, Mail, Info } from "lucide-react";
import { defaultTemplates } from "@/lib/email/templates";
import { EmailEvent } from "@/lib/email/types";

interface EmailSettings {
  enabled: boolean;
  fromName: string;
  replyTo: string;
  reminderDelay: number; // days
}

export default function EmailAutomationSettings() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: true,
    fromName: userProfile?.agencyName || userProfile?.name || "",
    replyTo: userProfile?.agencyEmail || userProfile?.email || "",
    reminderDelay: 3,
  });

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const settingsDoc = await getDoc(doc(db, "email_settings", user.uid));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as EmailSettings);
      } else {
        // Set defaults
        setSettings({
          enabled: true,
          fromName: userProfile?.agencyName || userProfile?.name || "",
          replyTo: userProfile?.agencyEmail || userProfile?.email || "",
          reminderDelay: 3,
        });
      }
    } catch (error) {
      console.error("Error loading email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultTemplatesAndRules = async () => {
    if (!user) return;

    try {
      // Check if templates already exist
      const templatesSnapshot = await getDocs(
        query(collection(db, "email_templates"), where("userId", "==", user.uid))
      );

      // Create default templates if they don't exist
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
      })) as Array<{ id: string; event?: string; [key: string]: any }>;

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
        const template = templates.find((t) => t.event === event);
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
            delay: 0, // Instant sending (0 seconds delay)
            enabled: true,
            createdAt: new Date(),
          });
        }
        return Promise.resolve();
      });

      await Promise.all(rulePromises);
    } catch (error) {
      console.error("Error initializing default templates and rules:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Get current settings to check if enabled status changed
      const currentSettingsDoc = await getDoc(doc(db, "email_settings", user.uid));
      const currentSettings = currentSettingsDoc.exists()
        ? (currentSettingsDoc.data() as EmailSettings)
        : null;
      const wasEnabled = currentSettings?.enabled || false;
      const isNowEnabled = settings.enabled;

      // Save settings
      await setDoc(doc(db, "email_settings", user.uid), settings, { merge: true });

      // If automation is being enabled (either for first time or re-enabled), initialize templates and rules
      if (isNowEnabled) {
        await initializeDefaultTemplatesAndRules();
      }

      alert("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
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
      {/* Info Card */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-700">
            <p className="font-medium text-gray-900 mb-1.5">How Email Automation Works</p>
            <ul className="space-y-0.5 list-disc list-inside text-gray-600">
              <li>Emails are sent from <strong>support@clienova.com</strong></li>
              <li>Your agency name appears as the sender</li>
              <li>Replies go directly to your business email</li>
              <li>No SMTP or DNS configuration required</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="border border-gray-100 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Email Settings</h2>

        <div className="space-y-5">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Email Automation</label>
              <p className="text-[10px] text-gray-500 mt-0.5">Turn on/off automated emails</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              From Name <span className="text-red-500">*</span>
            </label>
            <p className="text-[10px] text-gray-500 mb-1.5">This appears as the sender name in client emails</p>
            <input
              type="text"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              placeholder="Your Agency Name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
            />
          </div>

          {/* Reply-To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reply-To Email <span className="text-red-500">*</span>
            </label>
            <p className="text-[10px] text-gray-500 mb-1.5">Replies to automated emails will go to this address</p>
            <input
              type="email"
              value={settings.replyTo}
              onChange={(e) => setSettings({ ...settings, replyTo: e.target.value })}
              placeholder="your-email@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
            />
          </div>

          {/* Reminder Delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Invoice Reminder Delay
            </label>
            <p className="text-[10px] text-gray-500 mb-1.5">Days to wait before sending overdue reminders</p>
            <select
              value={settings.reminderDelay}
              onChange={(e) => setSettings({ ...settings, reminderDelay: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
            >
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
              <option value={10}>10 days</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || !settings.fromName || !settings.replyTo}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

