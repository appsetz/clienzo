"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Settings, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import EmailAutomationSettings from "@/components/email/EmailAutomationSettings";
import EmailTemplates from "@/components/email/EmailTemplates";
import AutomationRules from "@/components/email/AutomationRules";
import EmailLogs from "@/components/email/EmailLogs";

type Tab = "settings" | "templates" | "rules" | "logs";

export default function EmailAutomationPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("settings");

  useEffect(() => {
    // Redirect if not agency
    if (userProfile && userProfile.userType !== "agency") {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (userProfile.userType !== "agency") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Email Automation</h1>
            <p className="text-sm text-gray-500 mt-0.5">Automate professional emails to your clients</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="border-b border-gray-100 px-5">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "settings"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "templates"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </div>
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "rules"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Automation Rules
              </div>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "logs"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Email Logs
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === "settings" && <EmailAutomationSettings />}
          {activeTab === "templates" && <EmailTemplates />}
          {activeTab === "rules" && <AutomationRules />}
          {activeTab === "logs" && <EmailLogs />}
        </div>
      </div>
    </div>
  );
}

