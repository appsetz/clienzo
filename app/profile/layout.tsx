"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen bg-[#f8fafc]">
          <Sidebar />
          <div className="flex-1 md:ml-64 w-full flex flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden pb-20 md:pb-6">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

