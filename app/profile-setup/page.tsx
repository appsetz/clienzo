"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile } from "@/lib/firebase/auth";
import { Building2, User } from "lucide-react";
import { getClients, getProjects } from "@/lib/firebase/db";
import { checkClientLimit, checkProjectLimit } from "@/lib/plan-limits";

export default function ProfileSetupPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"type" | "details">("type");
  const [userType, setUserType] = useState<"freelancer" | "agency" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Freelancer fields
  const [freelancerData, setFreelancerData] = useState({
    phone: "",
    location: "",
    bio: "",
  });

  // Agency fields
  const [agencyData, setAgencyData] = useState({
    agencyName: "",
    agencyPhone: "",
    agencyEmail: "",
    agencyAddress: "",
    agencyWebsite: "",
    agencyDescription: "",
    numberOfEmployees: "",
  });


  useEffect(() => {
    if (userProfile?.profileComplete) {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const handleTypeSelection = (type: "freelancer" | "agency") => {
    setUserType(type);
    setStep("details");
  };

  const handleFreelancerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    try {
      const profileUpdate: any = {
        profileComplete: true,
        userType: "freelancer",
      };

      // Only include optional fields if they have values
      if (freelancerData.phone) profileUpdate.phone = freelancerData.phone;
      if (freelancerData.location) profileUpdate.location = freelancerData.location;
      if (freelancerData.bio) profileUpdate.bio = freelancerData.bio;

      await updateDoc(doc(db, "users", user.uid), profileUpdate);
      await refreshProfile();
      
      // All features are now available to everyone
      router.push("/dashboard/freelancer");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    try {
      const profileUpdate: any = {
        profileComplete: true,
        userType: "agency",
        agencyName: agencyData.agencyName,
      };

      // Only include optional fields if they have values
      if (agencyData.agencyPhone) profileUpdate.agencyPhone = agencyData.agencyPhone;
      if (agencyData.agencyEmail) profileUpdate.agencyEmail = agencyData.agencyEmail;
      if (agencyData.agencyAddress) profileUpdate.agencyAddress = agencyData.agencyAddress;
      if (agencyData.agencyWebsite) profileUpdate.agencyWebsite = agencyData.agencyWebsite;
      if (agencyData.agencyDescription) profileUpdate.agencyDescription = agencyData.agencyDescription;
      if (agencyData.numberOfEmployees) profileUpdate.numberOfEmployees = agencyData.numberOfEmployees;

      await updateDoc(doc(db, "users", user.uid), profileUpdate);
      await refreshProfile();
      
      // All features are now available to everyone
      router.push(`/dashboard/${userType}`);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };


  if (step === "type") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Clienova"
                  width={400}
                  height={133}
                  className="h-16 md:h-20 w-auto object-contain"
                />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Tell us about yourself to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleTypeSelection("freelancer")}
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-900 via-blue-700 to-blue-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">I&apos;m a Freelancer</h3>
              <p className="text-gray-600">
                Working independently and managing your own clients and projects
              </p>
              <div className="mt-3 text-xs text-gray-500">
                <p>• Manage clients and projects</p>
                <p>• Track payments and revenue</p>
                <p>• Set reminders and deadlines</p>
              </div>
            </button>

            <button
              onClick={() => handleTypeSelection("agency")}
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-900 via-blue-700 to-blue-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">I&apos;m an Agency</h3>
              <p className="text-gray-600">
                Running an agency with a team managing multiple clients
              </p>
              <div className="mt-3 text-xs text-gray-500">
                <p>• Manage team members</p>
                <p>• Assign projects to team</p>
                <p>• Track team payments</p>
              </div>
            </button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <button
            onClick={() => setStep("type")}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userType === "freelancer" 
              ? "Freelancer Details" 
              : "Agency Details"}
          </h1>
          <p className="text-gray-600">
            {userType === "freelancer" 
              ? "Complete your profile to start managing clients and projects"
              : "Complete your profile to start managing your agency and team"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {userType === "freelancer" ? (
          <form onSubmit={handleFreelancerSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={freelancerData.phone}
                onChange={(e) =>
                  setFreelancerData({ ...freelancerData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={freelancerData.location}
                onChange={(e) =>
                  setFreelancerData({ ...freelancerData, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio / About You
              </label>
              <textarea
                value={freelancerData.bio}
                onChange={(e) =>
                  setFreelancerData({ ...freelancerData, bio: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Tell us about yourself, your skills, and experience..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-slate-900 via-blue-700 to-blue-400 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAgencySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency Name *
              </label>
              <input
                type="text"
                value={agencyData.agencyName}
                onChange={(e) =>
                  setAgencyData({ ...agencyData, agencyName: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Your Agency Name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={agencyData.agencyPhone}
                  onChange={(e) =>
                    setAgencyData({ ...agencyData, agencyPhone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Email
                </label>
                <input
                  type="email"
                  value={agencyData.agencyEmail}
                  onChange={(e) =>
                    setAgencyData({ ...agencyData, agencyEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="contact@agency.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={agencyData.agencyAddress}
                onChange={(e) =>
                  setAgencyData({ ...agencyData, agencyAddress: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Street, City, State, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={agencyData.agencyWebsite}
                onChange={(e) =>
                  setAgencyData({ ...agencyData, agencyWebsite: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="https://www.agency.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Employees
              </label>
              <select
                value={agencyData.numberOfEmployees}
                onChange={(e) =>
                  setAgencyData({ ...agencyData, numberOfEmployees: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select range</option>
                <option value="1-5">1-5 employees</option>
                <option value="6-10">6-10 employees</option>
                <option value="11-25">11-25 employees</option>
                <option value="26-50">26-50 employees</option>
                <option value="51-100">51-100 employees</option>
                <option value="100+">100+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency Description
              </label>
              <textarea
                value={agencyData.agencyDescription}
                onChange={(e) =>
                  setAgencyData({ ...agencyData, agencyDescription: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Tell us about your agency, services, and expertise..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !agencyData.agencyName}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

