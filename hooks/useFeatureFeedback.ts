"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClients, getProjects, getPayments, getTeamMembers } from "@/lib/firebase/db";

export function useFeatureFeedback() {
  const { user, userProfile } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [checkingFeatures, setCheckingFeatures] = useState(true);

  // Check if user has already given feedback
  const hasGivenFeedback = userProfile?.feedback_given === true;

  // Track feature usage
  const checkFeatureUsage = useCallback(async () => {
    if (!user || hasGivenFeedback) {
      setCheckingFeatures(false);
      return;
    }

    try {
      // Check all features based on user type
      const [clients, projects, payments, teamMembers] = await Promise.all([
        getClients(user.uid),
        getProjects(user.uid),
        getPayments(user.uid),
        userProfile?.userType === "agency" ? getTeamMembers(user.uid) : Promise.resolve([]),
      ]);

      // Define required features based on user type
      const requiredFeatures = {
        hasClients: clients.length > 0,
        hasProjects: projects.length > 0,
        hasPayments: payments.length > 0,
        hasTeamMembers: userProfile?.userType === "agency" ? teamMembers.length > 0 : true, // Not required for freelancers
      };

      // Check if all required features have been used
      const allFeaturesUsed = 
        requiredFeatures.hasClients &&
        requiredFeatures.hasProjects &&
        requiredFeatures.hasPayments &&
        requiredFeatures.hasTeamMembers;

      // Show prompt if:
      // 1. All features have been used (first-time completion)
      // 2. User has used at least one feature and hasn't given feedback (returning user)
      const shouldShowPrompt = allFeaturesUsed || 
        (!hasGivenFeedback && (clients.length > 0 || projects.length > 0 || payments.length > 0));
      
      if (shouldShowPrompt) {
        // Small delay to ensure page is loaded
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking feature usage:", error);
    } finally {
      setCheckingFeatures(false);
    }
  }, [user, userProfile, hasGivenFeedback]);

  useEffect(() => {
    if (user && userProfile && !hasGivenFeedback) {
      checkFeatureUsage();
    } else {
      setCheckingFeatures(false);
    }
  }, [user, userProfile, hasGivenFeedback, checkFeatureUsage]);

  const handleFeedbackSubmitted = useCallback(async () => {
    setShowPrompt(false);
    // The feedback_given flag will be updated by ReviewPrompt component
  }, []);

  // Don't allow closing without submitting - make it persistent
  const handleClose = () => {
    // Do nothing - feedback is required
    // User must submit feedback to close
  };

  return { 
    showPrompt, 
    handleFeedbackSubmitted, 
    handleClose,
    checkingFeatures 
  };
}

