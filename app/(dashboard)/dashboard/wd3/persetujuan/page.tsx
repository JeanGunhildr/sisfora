import React from "react";
import { requireRole } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WD3PersetujuanManager from "@/components/wd3/WD3PersetujuanManager";
import { FileCheck2 } from "lucide-react";

export default async function WD3PersetujuanPage() {
  const { user, profile } = await requireRole(["wd3"]);

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <DashboardHeader
        nama={profile.nama}
        roleTitle="Wakil Dekan 3 (Bidang Kemahasiswaan)"
        role="wd3"
      />

      {/* Hero Banner matching Admin styling */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Persetujuan Surat Pengajuan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Persetujuan & Tanda Tangan Digital
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Tinjau permohonan peminjaman ruangan kategori umum serta permohonan organisasi yang telah ditandatangani Ketua Organisasi.
          </p>
        </div>
      </div>

      {/* Persetujuan Manager */}
      <WD3PersetujuanManager wd3Id={user.id} wd3Nama={profile.nama} />
    </div>
  );
}
