"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="pt-16 p-6">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

