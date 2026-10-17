import React from "react";
import { requireAuth } from "@/lib/auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifikasi autentikasi & status verifikasi mahasiswa
  const { profile } = await requireAuth();

  return (
    <div className="flex min-h-screen bg-[#F7F9FD] antialiased font-sans text-slate-800">
      {/* Educational Platform Style Sidebar */}
      <DashboardSidebar role={profile.role} nama={profile.nama} nim={profile.nim} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
