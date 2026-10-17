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
  BookOpen,
  MapPin,
  Maximize2,
  ChevronRight,
  Flame,
  Award,
  PenTool,
  AlertCircle,
  FileText,
  Calendar,
  ShieldAlert,
  Info,
} from "lucide-react";

export default async function MahasiswaDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profil mahasiswa
  const { data: profile } = await supabase
    .from("users")
    .select("id, nama, nim, role, status_verifikasi, alasan_penolakan")
    .eq("id", user.id)
    .single();

  const nama = profile?.nama || user.user_metadata?.nama || user.email?.split("@")[0] || "Mahasiswa";
  const nim = profile?.nim || user.user_metadata?.nim;
  const statusVerifikasi = profile?.status_verifikasi || "menunggu";

  const nowIso = new Date().toISOString();

  // 1. Fetch room stats
  const { data: ruangan } = await supabase.from("ruangan").select("id, status_ketersediaan");
  const totalRuangan = ruangan?.length ?? 0;
  const tersedia = ruangan?.filter((r) => r.status_ketersediaan === "tersedia").length ?? 0;
  const ditahan = ruangan?.filter((r) => r.status_ketersediaan === "ditahan").length ?? 0;
  const digunakan = ruangan?.filter((r) => r.status_ketersediaan === "digunakan").length ?? 0;

  // 2. Fetch total gedung
  const { count: totalGedung } = await supabase
    .from("gedung")
    .select("id", { count: "exact", head: true })
    .eq("status_aktif", true);

  const totalGedung = totalGedungCount ?? 2;

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

  const activeLoan = userLoans?.[0] as any || null;

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
      {/* Top Header Bar */}
      <DashboardHeader nama={nama} roleTitle="Mahasiswa Fakultas" role="mahasiswa" />

      {/* Alert Status Verifikasi Akun Mahasiswa jika belum disetujui */}
      {statusVerifikasi !== "disetujui" && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Akun Anda Sedang Dalam Proses Verifikasi KTM
            </h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Admin Fakultas sedang memvalidasi data KTM Anda. Anda tetap dapat melihat ketersediaan ruangan, denah, dan konsultasi dengan AI Asisten. Pengajuan peminjaman akan aktif penuh setelah akun disetujui.
            </p>
          </div>
        </div>
      )}

      {/* Hero Banner SISFORA */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-[#4F46E5] via-[#5A4EF8] to-[#3B82F6] p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Informasi Surat & Peminjaman Ruangan Fakultas</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Ingin Meminjam Ruangan?
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed">
              Ajukan fasilitas kelas, aula, atau laboratorium fakultas secara cepat, transparan, dan terhubung langsung ke sistem tanda tangan digital berjenjang.
            </p>

            {/* Action pill buttons */}
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
              <Link
                href="/dashboard/mahasiswa/alur-peminjaman"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/10 active:scale-95 transition-all"
              >
                Lihat Panduan Alur
              </Link>
            </div>
          </div>

          {/* Right Floating Badge Cards */}
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

      {/* Security Rule Notice: 1 Active Submission Limit */}
      {isSubmissionActive && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
              Pengajuan Aktif Sedang Berjalan ({activeLoan.nomor_pengajuan})
            </h4>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Untuk mencegah pemesanan ganda (spam), Anda dibatasi memiliki 1 pengajuan peminjaman aktif. Mohon tunggu proses hingga selesai sebelum mengajukan ruangan lain.
            </p>
          </div>
          <Link
            href="/dashboard/mahasiswa/peminjaman"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline shrink-0 mt-0.5"
          >
            Lihat Status
          </Link>
        </div>
      )}

      {/* 4 Stat Overview Cards - Connected Directly to Database */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ruangan Tersedia */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Ruangan Tersedia</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {tersedia}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Siap untuk dipinjam</p>
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
          <p className="text-[11px] text-amber-600 font-medium mt-1">Pengajuan & penahanan jadwal</p>
        </div>

        {/* Card 3: Ruangan Digunakan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Sedang Digunakan</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {digunakan}
          </p>
        </div>

        {/* Card 4: Total Gedung Fakultas */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Gedung Fakultas</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {totalGedung}
          </p>
          <p className="text-[11px] text-rose-600 font-medium mt-1">Gedung aktif terdaftar</p>
        </div>
      </div>

      {/* Pengajuan Terkini Section (Real Data from `pengajuan`) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Pengajuan Terkini Saya
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau tahapan verifikasi, penandatanganan digital, dan terbitnya izin surat
            </p>
          </div>
          <Link
            href="/dashboard/mahasiswa/peminjaman"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>Lihat Semua Pengajuan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeLoan ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center gap-5">
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
                  <Building2 className="w-10 h-10" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                {activeLoan.ruangan?.kode || "Ruangan"}
              </span>
            </div>

            {/* Middle Details */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 uppercase px-2 py-0.5 rounded-md tracking-wider">
                  {activeLoan.kategori === "organisasi" ? "Kegiatan Organisasi" : "Kegiatan Umum"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                  {activeLoan.nama_kegiatan}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    Ruang {activeLoan.ruangan?.kode} • {activeLoan.ruangan?.gedung?.nama || "Fakultas"} (Lantai {activeLoan.ruangan?.lantai})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(activeLoan.tanggal_mulai).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" ("}
                    {new Date(activeLoan.tanggal_mulai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {new Date(activeLoan.tanggal_selesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    {" WIB)"}
                  </span>
                </p>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                {activeLoan.ruangan?.nama || "Ruangan Peminjaman"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tahap Saat Ini: <strong className="text-indigo-600">{STATUS_LABEL[activeLoan.status] || activeLoan.status}</strong>
              </p>

              {/* Progress Bar */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Progres Alur Persetujuan</span>
                  <span className="font-bold text-indigo-600">
                    {STATUS_STEP_PERCENT[activeLoan.status] ?? 20}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeLoan.status.includes("ditolak")
                        ? "bg-rose-500"
                        : activeLoan.status === "disetujui"
                        ? "bg-emerald-500"
                        : "bg-indigo-600"
                    }`}
                    style={{ width: `${STATUS_STEP_PERCENT[activeLoan.status] || 25}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 self-end md:self-center w-full md:w-auto">
              <Link
                href="/dashboard/mahasiswa/peminjaman"
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <span>Lihat Detail Alur</span>
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

      {/* Rekomendasi Ruangan Kampus (Data Asli dari Database `ruangan`) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Rekomendasi Ruangan Fakultas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ruangan aktif dengan kapasitas optimal dan fasilitas lengkap di Gedung Fakultas
            </p>
          </div>
          <Link
            href="/dashboard/mahasiswa/ruangan"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>Lihat Semua ({totalRuangan} Ruangan)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3-Column Card Grid based on actual database rooms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendedRooms.length > 0 ? (
            recommendedRooms.map((room) => {
              const isAvailable = room.statusKetersediaan === "tersedia";
              const isHeld = room.statusKetersediaan === "ditahan";

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Thumbnail Foto */}
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {room.gedungNama}
                      </span>
                      <span className="text-xs text-slate-400">Lantai {room.lantai}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                      {room.nama}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {room.deskripsi || "Ruangan perkuliahan dan kegiatan akademik fakultas."}
                    </p>

                    {/* Fasilitas Tags from Database */}
                    {room.fasilitasList.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {room.fasilitasList.slice(0, 3).map((fName: string, fIdx: number) => (
                          <span
                            key={fIdx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600"
                          >
                            {fName}
                          </span>
                        ))}
                        {room.fasilitasList.length > 3 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400">
                            +{room.fasilitasList.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom Specs and Booking Button */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {room.kapasitas} mhs
                        </span>
                        {room.luas_m2 && (
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                            {room.luas_m2} m²
                          </span>
                        )}
                      </div>

                      {isSubmissionActive ? (
                        <span
                          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                          title="Selesaikan pengajuan aktif Anda terlebih dahulu"
                        >
                          Ada Pengajuan
                        </span>
                      ) : isAvailable ? (
                        <Link
                          href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          Ajukan Pinjam
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                          {isHeld ? "Sedang Ditahan" : "Tidak Tersedia"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 text-xs">
              Belum ada data ruangan terdaftar di database.
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Section (Connected to Real Database & AI Pencarian) */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            AI Asisten Pencarian Ruangan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ketik kebutuhan acara Anda dalam bahasa santai, AI akan menganalisis database ruangan, fasilitas, kapasitas, dan jadwal ketersediaan
          </p>
        </div>
        <AIPencarian />
      </div>
    </div>
  );
}
