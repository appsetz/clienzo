"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const DASHBOARD_TIME_THRESHOLD = 1 * 60 * 1000; // 1 minute in milliseconds
const STORAGE_KEY = "clienova_review_prompted";

export function useReviewPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has already been prompted (only once per user)
    const hasBeenPrompted = localStorage.getItem(`${STORAGE_KEY}_${user.uid}`);
    if (hasBeenPrompted) return;

    // Track dashboard visit start time
    const dashboardStartTime = Date.now();
    localStorage.setItem(`dashboard_start_${user.uid}`, dashboardStartTime.toString());

    // Show prompt after 1 minute on dashboard
    const timer = setTimeout(() => {
      // Double-check they haven't been prompted while waiting
      const stillNotPrompted = !localStorage.getItem(`${STORAGE_KEY}_${user.uid}`);
      if (stillNotPrompted) {
        setShowPrompt(true);
      }
    }, DASHBOARD_TIME_THRESHOLD);

    return () => {
      clearTimeout(timer);
    };
  }, [user]);

  const handleReviewSubmitted = () => {
    setShowPrompt(false);
    if (user) {
      // Mark as prompted so they won't see it again
      localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, "true");
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    if (user) {
      // Mark as prompted even if they close, so they don't get annoyed
      localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, "true");
    }
  };

  return { showPrompt, handleReviewSubmitted, handleClose };
}

