"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { UserProfile } from "@/lib/firebase/auth";
import { User, Mail, Phone, MapPin, FileText, Building2, Globe, Calendar, Users, Edit2, Save, X, Camera, Upload, Trash2, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import md5 from "crypto-js/md5";

// Get Gravatar URL from email
function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.toLowerCase().trim()).toString();
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Get profile photo URL - priority: uploaded photo > Gravatar
  const getProfilePhotoUrl = () => {
    if ((userProfile as any)?.photoURL) {
      return (userProfile as any).photoURL;
    }
    if (user?.email) {
      return getGravatarUrl(user.email, 200);
    }
    return null;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    setError("");

    try {
      // Upload to Firebase Storage with filename
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storageRef = ref(storage, `profile-photos/${user.uid}/avatar.${fileExtension}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update user profile
      await updateDoc(doc(db, "users", user.uid), { photoURL });
      await refreshProfile();
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      setError(err.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !confirm("Remove your profile photo?")) return;

    setUploadingPhoto(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { photoURL: null });
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || "Failed to remove photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setError("");
    setLoading(true);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (userProfile.userType === "freelancer") {
        if (formData.phone) updateData.phone = formData.phone;
        if (formData.location) updateData.location = formData.location;
        if (formData.bio) updateData.bio = formData.bio;
      } else if (userProfile.userType === "agency") {
        if (formData.agencyName) updateData.agencyName = formData.agencyName;
        if (formData.agencyPhone) updateData.agencyPhone = formData.agencyPhone;
        if (formData.agencyEmail) updateData.agencyEmail = formData.agencyEmail;
        if (formData.agencyAddress) updateData.agencyAddress = formData.agencyAddress;
        if (formData.agencyWebsite) updateData.agencyWebsite = formData.agencyWebsite;
        if (formData.agencyDescription) updateData.agencyDescription = formData.agencyDescription;
        if (formData.numberOfEmployees) updateData.numberOfEmployees = formData.numberOfEmployees;
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const isFreelancer = userProfile.userType === "freelancer";
  const isAgency = userProfile.userType === "agency";
  const photoUrl = getProfilePhotoUrl();
  const hasCustomPhoto = !!(userProfile as any)?.photoURL;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card with Profile Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
        
        {/* Profile Section */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 -mt-16">
            {/* Profile Photo */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-4xl">
                    {(userProfile.name || userProfile.agencyName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              {/* Photo Actions */}
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition shadow-lg"
                  title="Upload photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                {hasCustomPhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition shadow-lg"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name & Role */}
            <div className="flex-1 sm:pt-16">
              <h1 className="text-xl font-bold text-gray-900">
                {userProfile.name || userProfile.agencyName || "Your Name"}
              </h1>
              <p className="text-sm text-gray-500">
                {isAgency ? "Agency Manager" : "Freelancer"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Member since {format(new Date(userProfile.createdAt), "MMMM yyyy")}
              </p>
              
              {/* Edit Button - inline with text */}
              {!isEditing && (
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition w-full lg:w-auto lg:inline-flex justify-center"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                  
                  {/* Quick Action Links - Mobile */}
                  <div className="flex gap-2 lg:hidden">
                    {isAgency && (
                      <Link
                        href="/email-automation"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </Link>
                    )}
                    <a
                      href="mailto:support@clienova.com"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Support
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gravatar Info */}
          {!hasCustomPhoto && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                📷 Your profile photo is loaded from <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Gravatar</a> based on your email. 
                Upload a custom photo to override it.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Profile Information</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{userProfile.name || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{userProfile.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Freelancer Information */}
          {isFreelancer && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                Freelancer Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                      placeholder="+91 98765 43210"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                      placeholder="City, Country"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.location || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / About You</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="flex items-start gap-2 text-sm text-gray-900 py-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="whitespace-pre-wrap">{userProfile.bio || "Not provided"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agency Information */}
          {isAgency && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                Agency Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.agencyName}
                      onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.agencyName || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.agencyPhone}
                      onChange={(e) => setFormData({ ...formData, agencyPhone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.agencyPhone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.agencyEmail}
                      onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.agencyEmail || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.agencyWebsite}
                      onChange={(e) => setFormData({ ...formData, agencyWebsite: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                      placeholder="https://www.agency.com"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.agencyWebsite || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.agencyAddress}
                    onChange={(e) => setFormData({ ...formData, agencyAddress: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{userProfile.agencyAddress || "Not provided"}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Employees</label>
                  {isEditing ? (
                    <select
                      value={formData.numberOfEmployees}
                      onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
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
                    <div className="flex items-center gap-2 text-sm text-gray-900 py-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{userProfile.numberOfEmployees || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Description</label>
                {isEditing ? (
                  <textarea
                    value={formData.agencyDescription}
                    onChange={(e) => setFormData({ ...formData, agencyDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                    placeholder="Tell us about your agency..."
                  />
                ) : (
                  <div className="flex items-start gap-2 text-sm text-gray-900 py-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="whitespace-pre-wrap">{userProfile.agencyDescription || "Not provided"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
