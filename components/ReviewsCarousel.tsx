"use client";

import { useEffect, useState, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { getReviews, Review } from "@/lib/firebase/db";
import { format } from "date-fns";

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const reviewsData = await getReviews(20);
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length === 0 || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const scroll = () => {
      scrollPosition += scrollSpeed;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0; // Reset to start
      }
      
      container.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [reviews]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  // Duplicate reviews for seamless loop
  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            What Our Users Say
          </h2>
          <p className="text-gray-600">Real feedback from real users</p>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-hidden"
          style={{
            scrollBehavior: "auto",
          }}
        >
          {duplicatedReviews.map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 w-80 md:w-96 bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {review.comment && (
                <div className="mb-4">
                  <Quote className="w-6 h-6 text-purple-300 mb-2" />
                  <p className="text-gray-700 italic">&quot;{review.comment}&quot;</p>
                </div>
              )}

              {review.features_requested && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Feature Request:</span> {review.features_requested}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">{review.user_name}</p>
                  <p className="text-xs text-gray-500">
                    {format(review.createdAt, "MMM yyyy")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

