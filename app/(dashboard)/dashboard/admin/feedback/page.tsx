import React from "react";
import { requireRole } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MonitoringFeedbackView from "@/components/admin/MonitoringFeedbackView";
import { MessageSquare } from "lucide-react";

export default async function AdminFeedbackPage() {
  const { user, profile } = await requireRole(["admin"]);

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <DashboardHeader nama={profile.nama} roleTitle="Administrator Sistem" role="admin" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Pusat Suara Mahasiswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Monitoring Feedback Pengguna
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Pantau ulasan, rating kepuasan ruangan, dan feedback pengalaman peminjaman dari mahasiswa untuk evaluasi fasilitas.
          </p>
        </div>
      </div>

      {/* Feedback Monitoring View */}
      <MonitoringFeedbackView />
    </div>
  );
}
