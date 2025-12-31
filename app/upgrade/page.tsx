"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Building2, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function UpgradePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (userProfile?.plan !== "free") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">You're already on {userProfile.plan} plan!</h1>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAgency = userProfile?.userType === "agency";

  // Pro Plan Pricing - Limited Deal
  const proMonthlyPrice = 39;
  const proYearlyPrice = 468; // ₹39/month × 12 months
  const proYearlySavings = Math.round(((proMonthlyPrice * 12 - proYearlyPrice) / (proMonthlyPrice * 12)) * 100);

  // Agency Plan Pricing (only yearly)
  const agencyYearlyPrice = 499;

  const handleUpgrade = async (plan: "pro" | "agency") => {
    if (!user || !userProfile) {
      setError("Please log in to upgrade");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(plan);

    try {
      // Update user plan in Firestore
      // Note: Payment processing with Razorpay will be added later
      await updateDoc(doc(db, "users", user.uid), {
        plan: plan,
      });

      // Refresh user profile
      await refreshProfile();

      setSuccess(`Successfully upgraded to ${plan} plan!`);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Error upgrading plan:", err);
      setError(err.message || "Failed to upgrade plan. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
          🔥 LIMITED DEAL - Special Launch Price!
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Upgrade Your Plan</h1>
        <p className="text-base sm:text-lg text-gray-600 mb-2">Unlock unlimited clients, projects, and powerful features</p>
        <p className="text-sm text-orange-600 font-semibold">⚡ We're offering this low price for a limited time only!</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-center">
          <p className="font-semibold">{success}</p>
          <p className="text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Payment Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Payment processing will be integrated soon. For now, upgrades are activated immediately.
        </p>
      </div>

      {/* Billing Period Toggle - For Pro Plan */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              billingPeriod === "monthly"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              billingPeriod === "yearly"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Save {proYearlySavings}%
            </span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {/* Free Plan */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 border-2 border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
          <p className="text-4xl font-bold mb-6">
            ₹0<span className="text-lg text-gray-500">/month</span>
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Up to 3 Clients",
              "Up to 3 Active Projects",
              "Basic Dashboard",
              "Manual payment entry",
              "Web access",
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-xl p-6 md:p-8 text-white relative border-2 border-yellow-400">
          <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            🔥 LIMITED DEAL
          </div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5" />
              <h3 className="text-2xl font-bold">Pro</h3>
            </div>
            <div className="mb-2">
              {billingPeriod === "monthly" ? (
                <div>
                  <p className="text-4xl font-bold">
                    ₹{proMonthlyPrice}
                    <span className="text-lg opacity-90">/month</span>
                  </p>
                  <p className="text-sm opacity-90 mt-1">
                    Billed monthly
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-bold">
                    ₹{proYearlyPrice}
                    <span className="text-lg opacity-90">/year</span>
                  </p>
                  <p className="text-sm opacity-90 mt-1">
                    ₹{proYearlyPrice} for 12 months
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    (₹{proMonthlyPrice}/month × 12 months)
                  </p>
                </div>
              )}
            </div>
            {billingPeriod === "yearly" && (
              <p className="text-sm bg-green-500/20 text-green-100 px-2 py-1 rounded mb-2 inline-block">
                ₹{proYearlyPrice} for 12 months (₹{proMonthlyPrice}/month)
              </p>
            )}
            {billingPeriod === "monthly" && (
              <p className="text-sm bg-blue-500/20 text-blue-100 px-2 py-1 rounded mb-2 inline-block">
                Or choose yearly: ₹{proYearlyPrice} for 12 months
              </p>
            )}
            <p className="text-xs bg-yellow-500/30 text-yellow-100 px-2 py-1 rounded mb-4 inline-block font-semibold">
              ⚡ Limited time offer - Get it now before price increases!
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited Clients",
                "Unlimited Projects",
                "Payment Analytics",
                "Follow-up Reminders",
                "Export Data",
                "Revenue Insights",
                "Pending Payments Summary",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={loading !== null}
              className="w-full px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === "pro" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upgrading...
                </>
              ) : (
                "Upgrade to Pro"
              )}
            </button>
          </div>

        {/* Agency Plan */}
        <div className={`bg-gradient-to-br ${isAgency ? "from-blue-600 to-indigo-600" : "from-blue-500 to-indigo-500"} rounded-lg shadow-xl p-6 md:p-8 text-white relative`}>
          {isAgency && (
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
              Best for You
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5" />
            <h3 className="text-2xl font-bold">Agency</h3>
          </div>
          <div className="mb-2">
            <p className="text-4xl font-bold">
              ₹{agencyYearlyPrice}
              <span className="text-lg opacity-90">/year</span>
            </p>
            <p className="text-sm opacity-90 mt-1">
              ₹{Math.round(agencyYearlyPrice / 12)}/month billed annually
            </p>
          </div>
          <p className="text-sm bg-green-500/20 text-green-100 px-2 py-1 rounded mb-4 inline-block">
            Special Agency Pricing
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Unlimited Clients",
              "Unlimited Projects",
              "Payment Analytics",
              "Follow-up Reminders",
              "Export Data",
              "Revenue Insights",
              "Team Collaboration",
              "White-label Options",
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleUpgrade("agency")}
            disabled={loading !== null}
            className="w-full px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "agency" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Upgrading...
              </>
            ) : isAgency ? (
              "Upgrade to Agency"
            ) : (
              "Choose Agency Plan"
            )}
          </button>
        </div>
      </div>

      {/* Comparison Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Upgrade?</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• Track unlimited clients and projects as your business grows</li>
          <li>• Get insights into your revenue and pending payments</li>
          <li>• Never miss a follow-up with automated reminders</li>
          <li>• Export your data anytime for accounting and reporting</li>
          {isAgency && (
            <li>• Perfect for agencies with team collaboration and white-label features</li>
          )}
        </ul>
      </div>

      {/* Pricing Note */}
      <div className="text-center text-sm text-gray-600">
        <p>
          {isAgency ? (
            <>
              Agency plan is available at <strong>₹{agencyYearlyPrice}/year</strong> (billed annually only)
            </>
          ) : (
            <>
              Pro plan: <strong>₹{proMonthlyPrice}/month</strong> or <strong>₹{proYearlyPrice}/year</strong> (save {proYearlySavings}%)
            </>
          )}
        </p>
      </div>
    </div>
  );
}

