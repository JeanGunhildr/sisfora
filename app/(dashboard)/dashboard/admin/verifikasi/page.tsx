import React from "react";
import { requireRole } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UserVerificationManager from "@/components/admin/UserVerificationManager";
import { ShieldCheck, UserCheck } from "lucide-react";

export default async function AdminVerifikasiPage() {
  const { user, profile } = await requireRole(["admin"]);

  return (
    <div className="space-y-8">
      {/* Skillery-style Top Bar */}
      <DashboardHeader nama={profile.nama} roleTitle="Administrator Sistem" role="admin" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Identitas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Verifikasi & Validasi Akun Mahasiswa
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Periksa data pendaftaran dan kartu tanda mahasiswa (KTM) sebelum menyetujui akses peminjaman ruangan fakultas.
          </p>
        </div>
      </div>

      {/* Verification Manager */}
      <UserVerificationManager adminId={user.id} />
    </div>
  );
}
