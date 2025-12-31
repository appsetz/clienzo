"use client";

import Link from "next/link";
import { X, Check, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  limitType?: "clients" | "projects" | "general";
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title,
  message,
  limitType = "general",
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 md:p-8 relative shadow-2xl my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Upgrade to Pro and get:</h3>
          <ul className="space-y-2">
            {limitType === "clients" && (
              <>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited Clients</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited Projects</span>
                </li>
              </>
            )}
            {limitType === "projects" && (
              <>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited Projects</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited Clients</span>
                </li>
              </>
            )}
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Payment Analytics & Insights</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Follow-up Reminders</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Export Data (CSV/PDF)</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Revenue Insights</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/upgrade"
            onClick={onClose}
            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition text-center"
          >
            Upgrade to Pro - ₹159/month
          </Link>
          <button
            onClick={onClose}
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Or <span className="font-semibold">₹999/year</span> (Save 48%)
        </p>
      </div>
    </div>
  );
}

