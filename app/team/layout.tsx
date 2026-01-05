"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen bg-[#f8fafc]">
          <Sidebar />
          <div className="flex-1 md:ml-64 w-full">
            <main className="p-4 md:p-6 max-w-full overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
