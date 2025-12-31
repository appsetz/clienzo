"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 md:ml-64 w-full">
            <Header />
            <main className="pt-16 md:pt-16 p-3 sm:p-4 md:p-6 pb-6 max-w-full overflow-x-hidden">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

