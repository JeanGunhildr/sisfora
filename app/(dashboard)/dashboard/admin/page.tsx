import React from "react";
import { requireRole } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UserVerificationManager from "@/components/admin/UserVerificationManager";
import { ShieldCheck, Users, Clock, CheckCircle2 } from "lucide-react";

export default async function AdminDashboard() {
  const { user, profile } = await requireRole(["admin"]);

  return (
    <div className="space-y-8">
      {/* Skillery-style Top Bar */}
      <DashboardHeader nama={profile.nama} roleTitle="Administrator Sistem" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 sm:p-10 text-white shadow-xl shadow-teal-500/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel Kendali Verifikasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelola & Verifikasi Akun Mahasiswa
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-teal-100 font-normal leading-relaxed">
            Periksa kesesuaian data identitas kartu tanda mahasiswa (KTM) sebelum memberikan akses pengajuan peminjaman ruangan.
          </p>
        </div>
      </div>

      {/* User Verification Manager Table */}
      <UserVerificationManager adminId={user.id} />
    </div>
  );
}
