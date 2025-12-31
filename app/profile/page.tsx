"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile } from "@/lib/firebase/auth";
import { User, Mail, Phone, MapPin, FileText, Building2, Globe, Calendar, Users, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import UpgradeModal from "@/components/UpgradeModal";

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    // Agency fields
    agencyName: "",
    agencyPhone: "",
    agencyEmail: "",
    agencyAddress: "",
    agencyWebsite: "",
    agencyDescription: "",
    numberOfEmployees: "",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        agencyName: userProfile.agencyName || "",
        agencyPhone: userProfile.agencyPhone || "",
        agencyEmail: userProfile.agencyEmail || "",
        agencyAddress: userProfile.agencyAddress || "",
        agencyWebsite: userProfile.agencyWebsite || "",
        agencyDescription: userProfile.agencyDescription || "",
        numberOfEmployees: userProfile.numberOfEmployees || "",
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setError("");
    setLoading(true);

    try {
      const updateData: Partial<UserProfile> = {
        name: formData.name,
        email: formData.email,
      };

      if (userProfile.userType === "freelancer") {
        updateData.phone = formData.phone || undefined;
        updateData.location = formData.location || undefined;
        updateData.bio = formData.bio || undefined;
      } else if (userProfile.userType === "agency") {
        updateData.agencyName = formData.agencyName || undefined;
        updateData.agencyPhone = formData.agencyPhone || undefined;
        updateData.agencyEmail = formData.agencyEmail || undefined;
        updateData.agencyAddress = formData.agencyAddress || undefined;
        updateData.agencyWebsite = formData.agencyWebsite || undefined;
        updateData.agencyDescription = formData.agencyDescription || undefined;
        updateData.numberOfEmployees = formData.numberOfEmployees || undefined;
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      await refreshProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        agencyName: userProfile.agencyName || "",
        agencyPhone: userProfile.agencyPhone || "",
        agencyEmail: userProfile.agencyEmail || "",
        agencyAddress: userProfile.agencyAddress || "",
        agencyWebsite: userProfile.agencyWebsite || "",
        agencyDescription: userProfile.agencyDescription || "",
        numberOfEmployees: userProfile.numberOfEmployees || "",
      });
    }
    setIsEditing(false);
    setError("");
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isFreelancer = userProfile.userType === "freelancer";
  const isAgency = userProfile.userType === "agency";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sticky top-20 z-40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your account information</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-xl transition-all hover:scale-105 shadow-lg whitespace-nowrap text-base"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Plan Badge */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Plan</h2>
            <p className="text-gray-600 capitalize">{userProfile.plan} Plan</p>
          </div>
          {userProfile.plan === "free" && (
            <Link
              href="/upgrade"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="w-5 h-5 text-gray-400" />
                  <span>{userProfile.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{userProfile.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>{format(new Date(userProfile.createdAt), "MMMM dd, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Freelancer Information */}
          {isFreelancer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Freelancer Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{userProfile.phone || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="City, Country"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{userProfile.location || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About You</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Tell us about yourself, your skills, and experience..."
                  />
                ) : (
                  <div className="flex items-start gap-2 text-gray-900">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <span className="whitespace-pre-wrap">{userProfile.bio || "Not provided"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agency Information */}
          {isAgency && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Agency Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span>{userProfile.agencyName || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.agencyPhone}
                      onChange={(e) => setFormData({ ...formData, agencyPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span>{userProfile.agencyPhone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.agencyEmail}
                      onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span>{userProfile.agencyEmail || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.agencyAddress}
                    onChange={(e) => setFormData({ ...formData, agencyAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{userProfile.agencyAddress || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.agencyWebsite}
                    onChange={(e) => setFormData({ ...formData, agencyWebsite: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="https://www.agency.com"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span>{userProfile.agencyWebsite || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees</label>
                {isEditing ? (
                  <select
                    value={formData.numberOfEmployees}
                    onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select range</option>
                    <option value="1-5">1-5 employees</option>
                    <option value="6-10">6-10 employees</option>
                    <option value="11-25">11-25 employees</option>
                    <option value="26-50">26-50 employees</option>
                    <option value="51-100">51-100 employees</option>
                    <option value="100+">100+ employees</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-gray-900">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>{userProfile.numberOfEmployees || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Description</label>
                {isEditing ? (
                  <textarea
                    value={formData.agencyDescription}
                    onChange={(e) => setFormData({ ...formData, agencyDescription: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Tell us about your agency, services, and expertise..."
                  />
                ) : (
                  <div className="flex items-start gap-2 text-gray-900">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <span className="whitespace-pre-wrap">{userProfile.agencyDescription || "Not provided"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade to Pro"
        message="Upgrade to Pro to unlock unlimited clients, projects, and powerful features."
        limitType="general"
      />
    </div>
  );
}

