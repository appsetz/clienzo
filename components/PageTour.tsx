"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or data attribute
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: () => void; // Optional action to perform before showing step
}

interface PageTourProps {
  pageId: string; // Unique identifier for the page (e.g., "dashboard", "clients", "projects")
  steps: TourStep[];
  userType?: "freelancer" | "agency";
}

export default function PageTour({ pageId, steps, userType = "freelancer" }: PageTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const updateTargetElement = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;

    // Execute action if provided
    if (step.action) {
      step.action();
    }

    // Wait for element to be available
    const findElement = () => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setTargetElement((prev) => {
          // Reset any previous transitions
          if (prev) {
            prev.style.transition = "";
          }
          return element;
        });
        
        // Add entrance animation to element
        element.style.transition = "transform 0.3s ease-out, box-shadow 0.3s ease-out";
        element.style.transform = "scale(1.02)";
        
        setTimeout(() => {
          element.style.transform = "scale(1)";
        }, 300);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // Retry after a short delay
        setTimeout(findElement, 100);
      }
    };

    findElement();
  }, [steps]);

  useEffect(() => {
    // Check if user has completed the tour for this page
    const tourKey = `tour_completed_${pageId}_${user?.uid}`;
    const tourCompleted = localStorage.getItem(tourKey);
    
    // Check if user is new (hasn't completed any tour)
    const isNewUser = !localStorage.getItem(`any_tour_completed_${user?.uid}`);
    
    if (!tourCompleted && steps.length > 0) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        setIsVisible(true);
        updateTargetElement(0);
      }, 1000);
    }
  }, [pageId, user?.uid, steps.length, updateTargetElement]);

  useEffect(() => {
    if (isVisible && currentStep < steps.length) {
      updateTargetElement(currentStep);
    }
  }, [currentStep, isVisible, steps.length, updateTargetElement]);

  const handleNext = () => {
    // Add transition animation
    if (targetElement) {
      targetElement.style.transition = "all 0.3s ease-out";
    }
    
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }, 150);
  };

  const handlePrevious = () => {
    // Add transition animation
    if (targetElement) {
      targetElement.style.transition = "all 0.3s ease-out";
    }
    
    setTimeout(() => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }, 150);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (user?.uid) {
      localStorage.setItem(`tour_completed_${pageId}_${user.uid}`, "true");
      localStorage.setItem(`any_tour_completed_${user.uid}`, "true");
    }
  };

  if (!isVisible || !targetElement || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  if (!step) return null;

  // Get element position
  const rect = targetElement.getBoundingClientRect();
  
  // Calculate position for tooltip
  const tooltipWidth = 320;
  const tooltipHeight = 220;
  const spacing = 20;

  let tooltipTop = 0;
  let tooltipLeft = 0;

  switch (step.position) {
    case "top":
      tooltipTop = rect.top - tooltipHeight - spacing;
      tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      tooltipTop = rect.bottom + spacing;
      tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
      tooltipLeft = rect.left - tooltipWidth - spacing;
      break;
    case "right":
      tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
      tooltipLeft = rect.right + spacing;
      break;
    default:
      tooltipTop = window.innerHeight / 2 - tooltipHeight / 2;
      tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2;
  }

  // Keep tooltip within viewport
  tooltipTop = Math.max(20, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 20));
  tooltipLeft = Math.max(20, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 20));

  // Calculate spotlight position
  const spotlightRadius = Math.max(rect.width, rect.height) / 2 + 20;
  const spotlightCenterX = rect.left + rect.width / 2;
  const spotlightCenterY = rect.top + rect.height / 2;

  return (
    <>
      {/* Overlay with spotlight */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-auto animate-spotlight-fade-in"
        style={{
          background: `radial-gradient(circle at ${spotlightCenterX}px ${spotlightCenterY}px, transparent 0px, transparent ${spotlightRadius}px, rgba(0, 0, 0, 0.75) ${spotlightRadius + 10}px)`,
        }}
        onClick={handleNext}
      />

      {/* Highlighted element border */}
      <div
        className="fixed z-[9999] pointer-events-none border-4 border-purple-500 rounded-lg animate-scale-in animate-glow-pulse"
        style={{
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)",
        }}
      >
        <div className="absolute -inset-1 bg-purple-500 rounded-lg animate-pulse opacity-50"></div>
        <div className="absolute -inset-2 bg-purple-400 rounded-lg animate-pulse opacity-30" style={{ animationDelay: "0.5s" }}></div>
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-white rounded-lg shadow-2xl p-6 pointer-events-auto animate-slide-in-up"
        style={{
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          width: "320px",
        }}
      >
        <div className="flex items-start justify-between mb-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-transform hover:scale-110"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm leading-relaxed animate-fade-in" style={{ animationDelay: "0.1s" }}>{step.description}</p>

        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105 active:scale-95"
              }`}
            >
              <ChevronLeft className="w-4 h-4 inline mr-1" />
              Previous
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

