import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AIPencarian from "@/components/dashboard/AIPencarian";
import Link from "next/link";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  Compass,
  FileText,
  Layers,
  ChevronRight,
  Flame,
  Award,
  BookOpen,
  MapPin,
  Maximize2,
  PenTool,
} from "lucide-react";

export default async function MahasiswaDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("nama, nim, status_verifikasi")
    .eq("id", user.id)
    .single();

  const nama = profile?.nama || user.user_metadata?.nama || user.email?.split("@")[0] || "Mahasiswa";
  const nim = profile?.nim;

  // 1. Fetch room stats
  const { data: ruangan } = await supabase.from("ruangan").select("id, status_ketersediaan");
  const totalRuangan = ruangan?.length ?? 0;
  const tersedia = ruangan?.filter((r) => r.status_ketersediaan === "tersedia").length ?? 0;
  const ditahan = ruangan?.filter((r) => r.status_ketersediaan === "ditahan").length ?? 0;
  const digunakan = ruangan?.filter((r) => r.status_ketersediaan === "digunakan").length ?? 0;

  // 2. Fetch total gedung
  const { count: totalGedung } = await supabase
    .from("gedung")
    .select("id", { count: "exact", head: true });

  // 3. Fetch active peminjaman for this student
  const { data: activeLoans } = await supabase
    .from("peminjaman")
    .select(`
      id, status, kategori, tanggal_mulai, tanggal_selesai, waktu_mulai, waktu_selesai,
      keperluan, created_at,
      ruangan(nama, kode, lantai, foto_url, gedung(nama))
    `)
    .eq("pemohon_id", user.id)
    .not("status", "in", '("selesai","ditolak")')
    .order("created_at", { ascending: false })
    .limit(1);

  const activeLoan = activeLoans?.[0] as any;

  // 4. Fetch recommended rooms for "For You" section
  const { data: recommendedRooms } = await supabase
    .from("ruangan")
    .select(`
      id, nama, kode, kapasitas, luas, lantai, status_ketersediaan, foto_url,
      gedung(nama)
    `)
    .eq("status_aktif", true)
    .order("kapasitas", { ascending: false })
    .limit(3);

  const STATUS_STEP_PERCENT: Record<string, number> = {
    menunggu_ketua: 25,
    disetujui_ketua: 50,
    menunggu_wd3: 70,
    disetujui_wd3: 90,
    berlangsung: 100,
  };

  const STATUS_LABEL: Record<string, string> = {
    menunggu_wd3: "Menunggu Persetujuan WD3",
    menunggu_ketua: "Menunggu Tanda Tangan Ketua Org",
    disetujui_ketua: "Disetujui Ketua Org • Meneruskan ke WD3",
    disetujui_wd3: "Disetujui WD3 • Siap Digunakan",
    berlangsung: "Sedang Berlangsung",
    selesai: "Selesai",
    ditolak: "Pengajuan Ditolak",
  };

  return (
    <div className="space-y-8">
      {/* Skillery-style Top Bar */}
      <DashboardHeader nama={nama} roleTitle="Mahasiswa Fakultas" />

      {/* Hero Banner ("Ready to keep learning?" Skillery Vibe) */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-[#4F46E5] via-[#5A4EF8] to-[#3B82F6] p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        {/* Soft background glows */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Ready to book a room?
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed">
              Ajukan peminjaman fasilitas dan ruangan fakultas dengan cepat, transparan, dan terhubung langsung ke sistem tanda tangan digital.
            </p>

            {/* Action pill buttons matching Skillery image */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/mahasiswa/ruangan"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95 shadow-sm transition-all"
              >
                Cari Ruangan Tersedia
              </Link>
              <Link
                href="/dashboard/mahasiswa/peminjaman"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs border border-white/20 active:scale-95 transition-all"
              >
                Pantau Pengajuan Saya
              </Link>
            </div>
          </div>

          {/* Right Floating Badge Cards matching the Skillery screenshot */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/90 text-amber-700 backdrop-blur-md flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/90 text-indigo-600 backdrop-blur-md flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                <PenTool className="w-7 h-7" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-rose-100/90 text-rose-600 backdrop-blur-md flex items-center justify-center shadow-lg transform -rotate-2 hover:rotate-0 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards matching Skillery layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ruangan Tersedia */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Ruangan Tersedia</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {tersedia}
          </p>
        </div>

        {/* Card 2: Pengajuan Berjalan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Sedang Diproses</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {ditahan}
          </p>
        </div>

        {/* Card 3: Ruangan Digunakan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Sedang Digunakan</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {digunakan}
          </p>
        </div>

        {/* Card 4: Total Gedung */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Gedung Fakultas</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {totalGedung ?? 4}
          </p>
        </div>
      </div>

      {/* "Continue Learning" section -> "Peminjaman Terkini" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Pengajuan Terkini
          </h2>
          <Link
            href="/dashboard/mahasiswa/peminjaman"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Lihat Semua
          </Link>
        </div>

        {activeLoan ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-center gap-5">
            {/* Room Image Thumbnail */}
            <div className="w-full md:w-44 h-28 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0">
              {activeLoan.ruangan?.foto_url ? (
                <img
                  src={activeLoan.ruangan.foto_url}
                  alt={activeLoan.ruangan.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Middle Details */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 uppercase px-2 py-0.5 rounded-md tracking-wider">
                  {activeLoan.kategori === "organisasi" ? "Kegiatan Organisasi" : "Kegiatan Umum"}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(activeLoan.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                {activeLoan.ruangan?.nama || "Ruangan Peminjaman"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tahap Saat Ini: <strong className="text-indigo-600">{STATUS_LABEL[activeLoan.status] || activeLoan.status}</strong>
              </p>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${STATUS_STEP_PERCENT[activeLoan.status] || 40}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 self-end md:self-center w-full md:w-auto">
              <Link
                href="/dashboard/mahasiswa/peminjaman"
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <span>Pantau Status</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Tidak Ada Pengajuan Berjalan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Butuh ruangan kelas, aula, atau laboratorium untuk kegiatan akademik dan organisasi?
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/mahasiswa/ruangan"
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shrink-0"
            >
              Ajukan Ruangan Baru
            </Link>
          </div>
        )}
      </div>

      {/* "For You" Section -> "Rekomendasi Ruangan Kampus" */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Rekomendasi Ruangan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ruangan terpopuler dengan fasilitas lengkap untuk mendukung aktivitas mahasiswa
            </p>
          </div>
          <Link
            href="/dashboard/mahasiswa/ruangan"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Lihat Semua Ruangan →
          </Link>
        </div>

        {/* 3-Column Card Grid matching UI/UX, Startup, Public Speaking cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendedRooms && recommendedRooms.length > 0 ? (
            recommendedRooms.map((room, idx) => {
              const badges = [
                { label: "RUANG SEMINAR", color: "bg-cyan-50 text-cyan-700" },
                { label: "AULA UTAMA", color: "bg-emerald-50 text-emerald-700" },
                { label: "LABORATORIUM", color: "bg-purple-50 text-purple-700" },
              ];
              const badge = badges[idx % badges.length];

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Thumbnail */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {room.foto_url ? (
                      <img
                        src={room.foto_url}
                        alt={room.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-indigo-50 flex items-center justify-center text-slate-300">
                        <Building2 className="w-12 h-12" />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/60 shadow-2xs ${
                        room.status_ketersediaan === "tersedia"
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {room.status_ketersediaan === "tersedia" ? "Tersedia" : "Ditahan"}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block w-fit mb-2 ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                      {room.nama}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      {Array.isArray(room.gedung) ? (room.gedung[0]?.nama ? `${room.gedung[0].nama} • ` : "") : ((room.gedung as any)?.nama ? `${(room.gedung as any).nama} • ` : "")}Lantai {room.lantai}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kapasitas {room.kapasitas} org</span>
                      </div>

                      <Link
                        href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        Ajukan Pinjam
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 text-xs">
              Belum ada data ruangan tersedia.
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            AI Asisten Pencarian Ruangan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ketik kebutuhan acara Anda dalam bahasa santai, AI akan menganalisis ruangan dan jadwal terbaik
          </p>
        </div>
        <AIPencarian />
      </div>
    </div>
  );
}
