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
    <div className="flex h-screen overflow-hidden bg-[#F7F9FD] antialiased font-sans text-slate-800">
      {/* Educational Platform Style Sidebar - Static & Fixed */}
      <DashboardSidebar role={profile.role} nama={profile.nama} nim={profile.nim} />

      {/* Main Content Area - Scrollable Independently */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
