"use client";

import { useState } from "react";
import { X, Star, MessageSquare } from "lucide-react";
import { createReview } from "@/lib/firebase/db";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewPrompt({ isOpen, onClose, onSubmitted }: ReviewPromptProps) {
  const { user, userProfile } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [featuresRequested, setFeaturesRequested] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      await createReview({
        user_id: user.uid,
        user_name: userProfile?.name || user.email || "Anonymous",
        rating,
        comment: comment.trim() || "Great experience!",
        features_requested: featuresRequested.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
        // Reset form
        setRating(0);
        setComment("");
        setFeaturesRequested("");
        setSubmitted(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      const errorMessage = error?.message || error?.code || "Failed to submit review. Please try again.";
      alert(`Failed to submit review: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-600 fill-current" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600">Your feedback has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">How&apos;s your experience?</h3>
          <p className="text-gray-600 text-sm">We&apos;d love to hear your feedback!</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Rate your experience
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`w-10 h-10 transition ${
                  star <= rating
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              >
                <Star className="w-full h-full fill-current" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your feedback (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="Tell us what you think..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features you&apos;d like to see (optional)
          </label>
          <textarea
            value={featuresRequested}
            onChange={(e) => setFeaturesRequested(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="Any features or improvements you&apos;d like?"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Maybe Later
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

