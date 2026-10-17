import React from "react";
import { requireRole } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WD3RiwayatManager from "@/components/wd3/WD3RiwayatManager";
import { History } from "lucide-react";

export default async function WD3RiwayatPage() {
  const { profile } = await requireRole(["wd3"]);

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <DashboardHeader
        nama={profile.nama}
        roleTitle="Wakil Dekan 3 (Bidang Kemahasiswaan)"
        role="wd3"
      />

      {/* Hero Banner matching Admin styling */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 sm:p-10 text-white shadow-xl shadow-indigo-900/10">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Pengesahan Surat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Riwayat Persetujuan & Penolakan
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Daftar lengkap arsip permohonan peminjaman ruangan yang telah diproses, disahkan dengan tanda tangan digital, atau ditolak beserta catatan.
          </p>
        </div>
      </div>

      {/* Riwayat Manager */}
      <WD3RiwayatManager />
    </div>
  );
}
