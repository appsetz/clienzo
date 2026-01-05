"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Monitor, Smartphone } from "lucide-react";

// Public routes that should work on mobile
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
];

export default function MobileBlock() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      // Check if device is mobile based on screen width and user agent
      const isMobileDevice = 
        window.innerWidth < 1024 || // Less than 1024px width
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      
      setIsMobile(isMobileDevice);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Don't render anything until mounted (to avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Allow public routes on mobile
  if (PUBLIC_ROUTES.includes(pathname || "")) {
    return null;
  }

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Monitor className="w-20 h-20 text-purple-600" />
            <Smartphone className="w-12 h-12 text-pink-500 absolute -bottom-2 -right-2 bg-white rounded-full p-1" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Desktop Experience Required
          </h1>
          <p className="text-gray-600 leading-relaxed">
            This application is optimized for desktop browsers. Please open this site on a desktop or laptop computer for the best experience.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-purple-900">Why desktop?</p>
          <ul className="text-sm text-purple-700 text-left space-y-1 list-disc list-inside">
            <li>Better data visualization</li>
            <li>Enhanced dashboard features</li>
            <li>Improved productivity tools</li>
            <li>Full feature access</li>
          </ul>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-500">
            Minimum screen width: <span className="font-semibold">1024px</span>
          </p>
        </div>
      </div>
    </div>
  );
}

