"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div
        className={`flex-1 w-full flex flex-col transition-all duration-300 ${collapsed ? "md:ml-[72px]" : "md:ml-64"
          }`}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <ProtectedRoute>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ProtectedRoute>
      </SidebarProvider>
    </AuthProvider>
  );
}
