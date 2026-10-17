"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GitFork,
  Building2,
  FileText,
  PenTool,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  HardDrive,
  FileCheck2,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";

interface AlurPeminjamanViewProps {
  role: "mahasiswa" | "ketua_organisasi";
}

export default function AlurPeminjamanView({ role }: AlurPeminjamanViewProps) {
  const [activeTab, setActiveTab] = useState<"organisasi" | "umum">("organisasi");

  return (
    <div className="space-y-8">
      {/* Hero Header Card with Mascot */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 p-8 sm:p-10 text-white shadow-xl shadow-sky-500/20 border border-sky-400/20">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3 border border-white/25">
              <GitFork className="w-3.5 h-3.5 text-amber-300" />
              <span>Panduan Prosedur Fakultas</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Alur Pengajuan & Peminjaman Ruangan
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-sky-100 font-normal leading-relaxed">
              Pahami tahapan pengajuan ruangan mulai dari pencarian fasilitas, pengunggahan surat, proses tanda tangan digital, hingga terbitnya izin resmi dari Dekanat.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={role === "ketua_organisasi" ? "/dashboard/ketua-organisasi/ruangan" : "/dashboard/mahasiswa/ruangan"}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-blue-700 hover:bg-amber-50 active:scale-95 shadow-md shadow-slate-900/10 transition-all"
              >
                Mulai Cari Ruangan
              </Link>
              <Link
                href={role === "ketua_organisasi" ? "/dashboard/ketua-organisasi/peminjaman" : "/dashboard/mahasiswa/peminjaman"}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs border border-white/25 active:scale-95 transition-all"
              >
                Pantau Pengajuan Saya
              </Link>
            </div>
          </div>

          {/* Right Mascot Illustration & Warm Speech Bubble */}
          <div className="relative flex items-center justify-center lg:justify-end shrink-0 pt-2 lg:pt-0">
            <div className="hidden xl:block absolute -top-4 -left-14 bg-white/95 text-slate-800 px-3.5 py-1.5 rounded-2xl rounded-br-xs shadow-lg border border-amber-200 text-xs font-bold z-20 animate-pulse">
              Merpi antar suratmu aman! 🕊️✉️
            </div>
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-56 lg:h-56 drop-shadow-2xl hover:scale-105 transition-transform duration-300">
              <Image
                src="/maskot1.png"
                alt="Merpi Maskot SISFORA"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Pilih Kategori Alur
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tahapan persetujuan disesuaikan berdasarkan tujuan kegiatan Anda
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs self-start">
          <button
            onClick={() => setActiveTab("organisasi")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "organisasi"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kegiatan Organisasi</span>
          </button>
          <button
            onClick={() => setActiveTab("umum")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "umum"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Kegiatan Umum / Mandiri</span>
          </button>
        </div>
      </div>

      {/* Interactive Step Timeline */}
      {activeTab === "organisasi" ? (
        /* ALUR ORGANISASI */
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Mahasiswa ➔ Ketua Organisasi ➔ Wakil Dekan 3</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Alur Peminjaman Kegiatan Organisasi (HIMA / BEM / UKM)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Surat peminjaman diverifikasi dan ditandatangani oleh Ketua Organisasi terlebih dahulu sebelum disetujui WD3.
            </p>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 relative">
            {/* Step 1 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  1
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Pilih Ruangan & Jadwal
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Cari ruangan berstatus <strong className="text-emerald-600">Tersedia</strong> sesuai tanggal acara (sistem <em>First-Come, First-Served</em>).
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <span>⏱️</span>
                <span>Bebas bentrok jadwal</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  2
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Unggah Surat Proposal
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Isi data kegiatan organisasi dan unggah berkas surat permohonan dalam format <strong>PDF</strong>.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                <span>📄</span>
                <span>Menunggu Ketua Org</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  3
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  TTD Digital Ketua Ormawa
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Ketua Organisasi memeriksa berkas dan membubuhkan tanda tangan digital. Dokumen langsung ditimpa.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-violet-600 font-medium flex items-center gap-1">
                <span>✍️</span>
                <span>TTD sah di aplikasi</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  4
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Persetujuan Akhir WD3
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Wakil Dekan 3 menandatangani izin resmi. Status peminjaman disetujui dan surat izin siap diunduh.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span>✅</span>
                <span>Surat izin resmi terbit</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ALUR UMUM */
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Mahasiswa ➔ Wakil Dekan 3</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Alur Peminjaman Kegiatan Umum / Mandiri
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Untuk seminar, diskusi, atau riset kelompok langsung diteruskan ke WD3 tanpa melalui ketua ormawa.
            </p>
          </div>

          {/* Stepper Grid (3 Steps) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 relative">
            {/* Step 1 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  1
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Pilih Ruangan & Jadwal
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Cari ruangan kelas atau lab yang kosong sesuai kebutuhan tanggal dan jam kegiatan (FCFS).
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <span>⏱️</span>
                <span>First-Come, First-Served</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  2
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Unggah Surat Permohonan
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Pilih kategori <strong>Umum</strong> dan unggah file surat permohonan peminjaman ruangan (PDF).
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-blue-600 font-medium flex items-center gap-1">
                <span>📄</span>
                <span>Menunggu review WD3</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-200 hover:bg-white transition-all">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm mb-3">
                  3
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  TTD & Persetujuan WD3
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Wakil Dekan 3 menandatangani berkas secara digital. Izin resmi terbit dan jadwal ruangan terkunci sah.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span>✅</span>
                <span>Selesai & Disetujui</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Keunggulan & Prinsip Sistem SISFORA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Penghematan Memori Dokumen */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            Dokumen Tertimpa Otomatis
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Surat bertanda tangan digital menimpa berkas lama. Penyimpanan cloud hemat dan file selalu yang termutakhir.
          </p>
        </div>

        {/* Card 2: Log Riwayat Realtime */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            Log Pelacakan Transparan
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Setiap aksi tanda tangan dan persetujuan terekam realtime di riwayat pengajuan sehingga status selalu jelas.
          </p>
        </div>

        {/* Card 3: Fitur AI Cerdas */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            Pencarian Cerdas AI
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Cari ruangan cukup ketik kebutuhan acara di beranda. AI otomatis memfilter ruangan, fasilitas, dan jadwal kosong.
          </p>
        </div>
      </div>
    </div>
  );
}
