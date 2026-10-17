"use client";

import React from "react";
import { RoleUser, ROLE_LABELS, StatusVerifikasi } from "@/lib/types";
import { Sparkles, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface WelcomeBannerProps {
  nama: string;
  role: RoleUser;
  statusVerifikasi?: StatusVerifikasi;
  nim?: string | null;
}

export default function WelcomeBanner({
  nama,
  role,
  statusVerifikasi,
  nim,
}: WelcomeBannerProps) {
  return (
    <div className="w-full">
      {/* Hero Container with blue to light-blue gradient matching the image */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-blue-700 via-blue-600 to-sky-400 p-8 sm:p-14 text-white shadow-xl shadow-blue-500/15">
        {/* Subtle decorative glass panels like in the reference image */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-300/20 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />
        
        {/* Decorative translucent floating shape in top-right */}
        <div className="hidden lg:block absolute right-12 bottom-6 w-56 h-36 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 pointer-events-none transform -rotate-2" />
        <div className="hidden lg:block absolute right-24 bottom-12 w-48 h-28 bg-white/15 backdrop-blur-lg rounded-2xl border border-white/25 pointer-events-none transform rotate-3" />

        {/* Content Centered */}
        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">
          {/* Role Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold tracking-wide mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>Dashboard {ROLE_LABELS[role]}</span>
            {nim && <span className="text-blue-100">• {nim}</span>}
          </div>

          {/* Large Welcome Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-xs">
            Selamat Datang,{" "}
            <span className="text-sky-100 underline decoration-sky-300/60 decoration-wavy decoration-2">
              {nama}!
            </span>{" "}
            👋
          </h1>

          <p className="mt-4 text-sm sm:text-base text-blue-50/90 max-w-lg leading-relaxed font-normal">
            Sistem Informasi Pengajuan & Peminjaman Ruangan Fakultas. Akses layanan peminjaman fasilitas terintegrasi dalam satu platform.
          </p>

          {/* Mahasiswa verification status badge */}
          {role === "mahasiswa" && statusVerifikasi && (
            <div className="mt-8">
              {statusVerifikasi === "menunggu" ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-medium text-white shadow-sm">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    Status Akun: <strong className="text-amber-200">Menunggu Verifikasi Admin</strong> (Bukti KTM sedang ditinjau)
                  </span>
                </div>
              ) : statusVerifikasi === "diverifikasi" ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-medium text-white shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>
                    Status Akun: <strong className="text-emerald-200">Terverifikasi Aktif</strong>
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-300/40 text-xs font-medium text-white shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>
                    Status Akun: <strong className="text-rose-200">Ditolak</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
