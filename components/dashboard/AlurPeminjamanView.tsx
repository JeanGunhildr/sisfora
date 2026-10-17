"use client";

import React, { useState } from "react";
import Link from "next/link";
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
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <GitFork className="w-3.5 h-3.5" />
            <span>Panduan Prosedur Fakultas</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Alur Pengajuan & Peminjaman Ruangan
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed">
            Pahami tahapan pengajuan ruangan mulai dari pencarian fasilitas, pengunggahan surat, proses tanda tangan digital, hingga terbitnya izin resmi dari Dekanat.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={role === "ketua_organisasi" ? "/dashboard/ketua-organisasi/ruangan" : "/dashboard/mahasiswa/ruangan"}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95 shadow-sm transition-all"
            >
              Mulai Cari Ruangan
            </Link>
            <Link
              href={role === "ketua_organisasi" ? "/dashboard/ketua-organisasi/peminjaman" : "/dashboard/mahasiswa/peminjaman"}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs border border-white/20 active:scale-95 transition-all"
            >
              Pantau Pengajuan Saya
            </Link>
          </div>
        </div>

        {/* Decorative Floating Badges */}
        <div className="hidden lg:flex items-center gap-3 absolute right-10 top-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-lg">
            <FileText className="w-7 h-7 text-amber-200" />
            <span className="text-[10px] font-bold mt-1">Upload</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-lg">
              <PenTool className="w-7 h-7 text-sky-200" />
              <span className="text-[10px] font-bold mt-1">Digital TTD</span>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-emerald-200" />
              <span className="text-[10px] font-bold mt-1">Approved</span>
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
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xs space-y-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Jalur Persetujuan: Mahasiswa ➔ Ketua Organisasi ➔ Wakil Dekan 3</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Alur Peminjaman untuk Acara Organisasi (HIMA / BEM / UKM)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Surat peminjaman wajib diverifikasi dan ditandatangani terlebih dahulu oleh Ketua Organisasi terkait sebelum diajukan ke Wakil Dekan 3.
            </p>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Cari Ruangan & Tahan Jadwal
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Mahasiswa mencari ruangan yang berstatus <strong className="text-emerald-600">Tersedia</strong>. Saat membuka formulir pengajuan, sistem secara otomatis menahan jadwal ruangan (<span className="text-amber-600 font-semibold">Kuning / Ditahan</span>) selama 15 menit agar tidak saling berebut dengan mahasiswa lain.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium">
                ⏱️ Penahanan jadwal otomatis
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Unggah Berkas Proposal / Surat
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Pilih kategori <strong>Organisasi</strong>, lalu unggah berkas surat permohonan dalam format PDF. Sistem akan langsung mencatat pengajuan dan meneruskan dokumen ke dashboard <strong>Ketua Organisasi</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-indigo-600 font-medium">
                📄 Status: Menunggu Ketua Org
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Verifikasi & TTD Ketua Organisasi
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ketua Organisasi memeriksa kesesuaian anggota dan kepentingannya. Jika sesuai, Ketua Organisasi menandatangani surat secara digital di aplikasi. Dokumen awal <strong>langsung ditimpa</strong> dengan file bertanda tangan, kemudian diteruskan ke <strong>Wakil Dekan 3</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-violet-600 font-medium">
                ✍️ Tanda tangan digital via sistem
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  4
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Persetujuan Akhir Wakil Dekan 3
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Wakil Dekan 3 melakukan peninjauan akhir dan membubuhkan tanda tangan digital dekanat. Dokumen kembali ditimpa dengan versi final yang sah. Status ruangan berubah menjadi <strong>Disetujui</strong> dan mahasiswa dapat mengunduh surat izin resmi.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-emerald-600 font-medium">
                ✅ Selesai & Surat Resmi Terbit
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ALUR UMUM */
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xs space-y-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Jalur Persetujuan Langsung: Mahasiswa ➔ Wakil Dekan 3</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Alur Peminjaman untuk Kepentingan Umum / Mandiri
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Untuk kegiatan akademik non-organisasi (seminar skripsi, riset kelompok, diskusi mandiri), berkas diteruskan langsung ke Wakil Dekan 3 tanpa melalui ketua organisasi.
            </p>
          </div>

          {/* Stepper Grid (3 Steps) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Cari Ruangan & Tahan Jadwal
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Mahasiswa mencari ruangan yang tersedia berdasarkan kapasitas, fasilitas, atau denah. Jadwal ruangan otomatis ditahan sementara (status: <span className="text-amber-600 font-semibold">Ditahan</span>) agar tidak bentrok dengan mahasiswa lain saat pengisian form.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium">
                ⏱️ Penahanan jadwal 15 menit
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Unggah Surat Permohonan Umum
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Pilih kategori <strong>Umum</strong> pada form peminjaman dan unggah surat permohonan. Sistem secara otomatis meneruskan berkas langsung ke antrean verifikasi <strong>Wakil Dekan 3</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-blue-600 font-medium">
                📄 Status: Menunggu WD3
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-200 hover:bg-white transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Tanda Tangan & Persetujuan WD3
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Wakil Dekan 3 memeriksa urgensi peminjaman dan membubuhkan tanda tangan digital di aplikasi. Dokumen ditimpa dengan versi bertanda tangan resmi, dan ruangan siap digunakan sesuai jadwal yang disetujui.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-emerald-600 font-medium">
                ✅ Selesai & Disetujui
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Keunggulan & Prinsip Sistem SISFORA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Penghematan Memori Dokumen */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <HardDrive className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Penyimpanan Dokumen Tertimpa (Hemat Memori)
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Setiap kali surat ditandatangani oleh Ketua Organisasi atau Wakil Dekan 3, berkas lama secara efisien ditimpa dengan versi terbaru. Sistem tidak menduplikasi file PDF di cloud storage, sehingga hemat memori dan selalu menyajikan dokumen paling mutakhir.
          </p>
        </div>

        {/* Card 2: Log Riwayat Realtime */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Log Perkembangan Real-Time
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Meskipun dokumen ditimpa, seluruh jejak aktivitas (siapa yang menandatangani, waktu persetujuan, dan catatan verifikator) dicatat secara terpisah di tabel log sistem dan ditampilkan di halaman Status Peminjaman.
          </p>
        </div>

        {/* Card 3: Fitur AI Cerdas */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Pencarian Cerdas Berbasis AI
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tidak perlu mencari manual satu per satu. Pengguna cukup mengetikkan prompt kebutuhan di Beranda (misal: kapasitas, lantai, fasilitas AC/proyektor), dan AI akan menganalisis database serta mencarikan ruangan terbaik.
          </p>
        </div>
      </div>
    </div>
  );
}
