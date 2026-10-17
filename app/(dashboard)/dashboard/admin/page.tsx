import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  Users,
  Building2,
  DoorOpen,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Star,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Compass,
} from "lucide-react";

export default async function AdminDashboard() {
  const { user, profile } = await requireRole(["admin"]);
  const supabase = await createClient();

  // 1. Fetch Users Statistics
  const { data: usersData } = await supabase
    .from("users")
    .select("id, status_verifikasi, role, created_at")
    .eq("role", "mahasiswa");

  const usersList = usersData || [];
  const totalMahasiswa = usersList.length;
  const pendingMahasiswa = usersList.filter((u) => u.status_verifikasi === "menunggu").length;
  const approvedMahasiswa = usersList.filter((u) => u.status_verifikasi === "disetujui").length;
  const rejectedMahasiswa = usersList.filter((u) => u.status_verifikasi === "ditolak").length;

  // 2. Fetch Gedung & Ruangan Statistics
  const { data: gedungData } = await supabase.from("gedung").select("id, nama, status_aktif");
  const gedungList = gedungData || [];
  const totalGedung = gedungList.length;
  const aktifGedung = gedungList.filter((g) => g.status_aktif).length;

  const { data: ruanganData } = await supabase
    .from("ruangan")
    .select("id, kode, kapasitas, lantai, status_aktif, gedung:gedung_id(nama)");
  const ruanganList = ruanganData || [];
  const totalRuangan = ruanganList.length;
  const aktifRuangan = ruanganList.filter((r) => r.status_aktif).length;
  const totalKapasitas = ruanganList.reduce((acc, r) => acc + (r.kapasitas || 0), 0);

  // 3. Fetch Pengajuan Peminjaman Statistics & Latest
  const { data: pengajuanData } = await supabase
    .from("pengajuan")
    .select(`
      id,
      nomor_pengajuan,
      nama_kegiatan,
      jenis_peminjaman,
      status,
      tanggal_mulai,
      tanggal_selesai,
      created_at,
      pemohon:pemohon_id(nama, nim),
      ruangan:ruangan_id(kode, gedung:gedung_id(nama))
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  const pengajuanList = pengajuanData || [];
  const totalPengajuan = pengajuanList.length;

  // 4. Fetch Feedback Statistics & Latest
  const { data: feedbackData } = await supabase
    .from("feedback")
    .select(`
      id,
      rating,
      komentar,
      jenis_feedback,
      created_at,
      user:user_id(nama),
      ruangan:ruangan_id(kode)
    `)
    .order("created_at", { ascending: false })
    .limit(4);

  const feedbackList = feedbackData || [];
  const totalFeedback = feedbackList.length;
  const avgRating =
    totalFeedback > 0
      ? (feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-8 pb-12">
      {/* Header bar with role notifications */}
      <DashboardHeader nama={profile.nama} roleTitle="Administrator Sistem" role="admin" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel Utama Administrator SISFORA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Pusat Monitoring & Statistik Sistem
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Pantau statistik verifikasi mahasiswa, utilisasi gedung & ruangan fakultas, pengajuan peminjaman, serta feedback mahasiswa secara real-time.
          </p>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Pending Account Alert Bar (If any) */}
      {pendingMahasiswa > 0 && (
        <div className="bg-amber-500/10 border border-amber-200/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Ada {pendingMahasiswa} akun mahasiswa menunggu verifikasi KTM!
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Segera validasi berkas kartu tanda mahasiswa agar mereka dapat mengajukan peminjaman.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin/verifikasi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto shrink-0"
          >
            <span>Verifikasi Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ========================================================
          STATISTICS CARDS (4 Grid Cards)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Mahasiswa */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mahasiswa Terdaftar
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {totalMahasiswa}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {approvedMahasiswa} Aktif
            </span>
            <span className="text-amber-600 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {pendingMahasiswa} Menunggu
            </span>
          </div>
        </div>

        {/* Stat 2: Gedung & Ruangan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fasilitas Ruangan
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {totalRuangan}{" "}
            <span className="text-xs font-normal text-slate-400">Ruangan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {totalGedung} Gedung ({aktifGedung} Aktif)
            </span>
            <span className="text-indigo-600 font-semibold">
              Kapasitas: {totalKapasitas}
            </span>
          </div>
        </div>

        {/* Stat 3: Peminjaman */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Peminjaman Ruangan
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {totalPengajuan}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/dashboard/admin/peminjaman"
              className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              <span>Lihat Semua Data</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Stat 4: Feedback */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Feedback Pengguna
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {avgRating}
            </span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>{totalFeedback} Ulasan masuk</span>
            <Link
              href="/dashboard/admin/feedback"
              className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <span>Monitoring</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================
          QUICK ACTIONS SECTION
          ======================================================== */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 tracking-tight">
          Akses Cepat Pengelolaan Sistem
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/admin/verifikasi"
            className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Verifikasi Akun
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Validasi KTM mahasiswa
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/gedung"
            className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-blue-200 hover:shadow-md transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Kelola Gedung
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                CRUD gedung fakultas
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/ruangan"
            className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-cyan-200 hover:shadow-md transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                Kelola Ruangan
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                CRUD ruangan & kapasitas
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/peminjaman"
            className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-amber-200 hover:shadow-md transition-all group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                Monitoring Peminjaman
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Arsip & status pengajuan
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================
          TWO COLUMN PANELS: RECENT LOANS & RECENT FEEDBACK
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel 1: Pengajuan Terbaru */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Pengajuan Peminjaman Terbaru
                </h3>
              </div>
              <Link
                href="/dashboard/admin/peminjaman"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {pengajuanList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada data pengajuan peminjaman tercatat di database.
              </div>
            ) : (
              <div className="space-y-3">
                {pengajuanList.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {p.nama_kegiatan}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{p.pemohon?.nama || "Mahasiswa"}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600">
                          {p.ruangan?.kode || "Ruangan"}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(p.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700 shrink-0">
                      {p.status || "menunggu"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Feedback Terbaru */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Feedback & Masukan Terbaru
                </h3>
              </div>
              <Link
                href="/dashboard/admin/feedback"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {feedbackList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada feedback yang masuk dari mahasiswa.
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((f: any) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-slate-800">
                          {f.user?.nama || "Anonim"}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(f.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(f.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{f.komentar || "Tidak ada komentar tertulis."}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
