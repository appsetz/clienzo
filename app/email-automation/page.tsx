"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Settings, FileText, Clock } from "lucide-react";
import EmailAutomationSettings from "@/components/email/EmailAutomationSettings";
import EmailTemplates from "@/components/email/EmailTemplates";
import AutomationRules from "@/components/email/AutomationRules";

type Tab = "settings" | "templates" | "rules";

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
      <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">Email Automation</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Automate professional emails to your clients</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="border-b border-gray-100 px-3 md:px-5">
          <nav className="flex space-x-2 md:space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-3 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition whitespace-nowrap ${
                activeTab === "settings"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-3 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition whitespace-nowrap ${
                activeTab === "templates"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`py-3 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition whitespace-nowrap ${
                activeTab === "rules"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Rules</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-3 md:p-5">
          {activeTab === "settings" && <EmailAutomationSettings />}
          {activeTab === "templates" && <EmailTemplates />}
          {activeTab === "rules" && <AutomationRules />}
        </div>
      </div>
    </div>
  );
}

