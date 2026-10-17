import React from "react";
import Image from "next/image";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AIPencarian from "@/components/dashboard/AIPencarian";
import Link from "next/link";
import {
  PenTool,
  Building2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  AlertCircle,
  Calendar,
  Maximize2,
  ChevronRight,
  BookOpen,
  Award,
  Info,
} from "lucide-react";

export default async function KetuaOrganisasiDashboard() {
  const { user, profile } = await requireRole(["ketua_organisasi"]);
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  // 1. Fetch data organisasi yang diketuai
  const { data: org } = await supabase
    .from("organisasi")
    .select("id, nama, singkatan")
    .eq("ketua_id", user.id)
    .single();

  // 2. Fetch pengajuan anggota organisasi yang menunggu tanda tangan ketua
  let pendingRequestsQuery = supabase
    .from("pengajuan")
    .select(`
      id,
      nomor_pengajuan,
      nama_kegiatan,
      deskripsi_kegiatan,
      jenis_peminjaman,
      jumlah_peserta,
      status,
      tanggal_mulai,
      tanggal_selesai,
      created_at,
      pemohon:users!pengajuan_pemohon_id_fkey(nama, nim, email),
      ruangan:ruangan!pengajuan_ruangan_id_fkey(
        id,
        kode,
        kapasitas,
        lantai,
        gedung:gedung!ruangan_gedung_id_fkey(nama)
      )
    `)
    .eq("status", "menunggu_ketua")
    .order("created_at", { ascending: false });

  if (org?.id) {
    pendingRequestsQuery = pendingRequestsQuery.eq("organisasi_id", org.id);
  } else {
    pendingRequestsQuery = pendingRequestsQuery.eq("jenis_peminjaman", "organisasi");
  }

  const { data: pendingRequests } = await pendingRequestsQuery;
  const totalPending = pendingRequests?.length ?? 0;

  // 3. Fetch seluruh data ruangan aktif dari database
  const { data: ruanganRaw } = await supabase
    .from("ruangan")
    .select(`
      id,
      kode,
      deskripsi,
      kapasitas,
      luas_m2,
      lantai,
      url_foto,
      status_aktif,
      gedung:gedung_id(id, nama, deskripsi),
      ruangan_fasilitas(
        jumlah,
        keterangan,
        fasilitas:fasilitas_id(id, nama, satuan)
      )
    `)
    .eq("status_aktif", true)
    .order("kapasitas", { ascending: false });

  const ruanganList = ruanganRaw || [];
  const totalRuangan = ruanganList.length;

  // 4. Cek ketersediaan aktual ruangan
  const { data: activeBookings } = await supabase
    .from("pengajuan")
    .select("ruangan_id")
    .eq("status", "disetujui")
    .lte("tanggal_mulai", nowIso)
    .gte("tanggal_selesai", nowIso);

  const bookedRoomIds = new Set((activeBookings || []).map((b) => b.ruangan_id));

  const { data: pendingPengajuanList } = await supabase
    .from("pengajuan")
    .select("ruangan_id")
    .in("status", ["menunggu_upload", "menunggu_ketua", "menunggu_wd3"]);

  const pendingRoomIds = new Set((pendingPengajuanList || []).map((p) => p.ruangan_id));

  const tersediaCount = ruanganList.filter(
    (r) => !bookedRoomIds.has(r.id) && !pendingRoomIds.has(r.id)
  ).length;

  // 5. Fetch pengajuan peminjaman pribadi milik Ketua Organisasi (sebagai pemohon)
  const { data: userLoans } = await supabase
    .from("pengajuan")
    .select(`
      id,
      nomor_pengajuan,
      nama_kegiatan,
      deskripsi_kegiatan,
      jenis_peminjaman,
      jumlah_peserta,
      status,
      alasan_penolakan,
      tanggal_mulai,
      tanggal_selesai,
      created_at,
      ruangan:ruangan_id(
        id,
        kode,
        deskripsi,
        lantai,
        url_foto,
        kapasitas,
        luas_m2,
        gedung:gedung_id(id, nama)
      ),
      organisasi:organisasi_id(id, nama, singkatan)
    `)
    .eq("pemohon_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const activeLoan = userLoans?.[0] as any || null;

  // Aturan 1 pengajuan aktif per user
  const isSubmissionActive =
    activeLoan &&
    (["menunggu_upload", "menunggu_ketua", "menunggu_wd3"].includes(activeLoan.status) ||
      (activeLoan.status === "disetujui" && new Date(activeLoan.tanggal_selesai) > new Date()));

  // 6. Siapkan rekomendasi 3 ruangan teratas
  const recommendedRooms = ruanganList.slice(0, 3).map((room: any) => {
    let statusKetersediaan: "tersedia" | "ditahan" | "digunakan" = "tersedia";
    if (bookedRoomIds.has(room.id)) {
      statusKetersediaan = "digunakan";
    } else if (pendingRoomIds.has(room.id)) {
      statusKetersediaan = "ditahan";
    }

    const fasilitasList = (room.ruangan_fasilitas || [])
      .map((rf: any) => rf.fasilitas?.nama)
      .filter(Boolean);

    const gedungNama = Array.isArray(room.gedung)
      ? room.gedung[0]?.nama
      : room.gedung?.nama || "Fakultas";

    return {
      ...room,
      gedungNama,
      statusKetersediaan,
      fasilitasList,
    };
  });

  const STATUS_STEP_PERCENT: Record<string, number> = {
    menunggu_upload: 25,
    menunggu_ketua: 50,
    menunggu_wd3: 75,
    disetujui: 100,
    ditolak_ketua: 100,
    ditolak_wd3: 100,
    dibatalkan: 100,
    kedaluwarsa: 100,
  };

  const STATUS_LABEL: Record<string, string> = {
    menunggu_upload: "Menunggu Unggah Berkas",
    menunggu_ketua: "Menunggu TTD Ketua",
    menunggu_wd3: "Menunggu Persetujuan WD3",
    disetujui: "Disetujui Dekanat • Izin Terbit",
    ditolak_ketua: "Ditolak Ketua Organisasi",
    ditolak_wd3: "Ditolak Wakil Dekan 3",
    dibatalkan: "Pengajuan Dibatalkan",
    kedaluwarsa: "Waktu Pengajuan Kedaluwarsa",
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <DashboardHeader
        nama={profile.nama}
        roleTitle={`Ketua Organisasi ${org?.singkatan ? `(${org.singkatan})` : ""}`}
        role="ketua_organisasi"
      />

      {/* Hero Banner with Mascot & Dual Actions (Pinjam Ruangan + Tanda Tangan) */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 p-8 sm:p-10 text-white shadow-xl shadow-sky-500/20 border border-sky-400/20">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3 border border-white/25">
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span>{org?.nama ? `${org.nama} (${org.singkatan})` : "Ketua Organisasi Mahasiswa"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Dashboard &amp; Persetujuan Ketua Organisasi
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-sky-100 font-normal leading-relaxed">
              Anda dapat meminjam sarana ruangan untuk kegiatan akademik maupun organisasi, serta memverifikasi dan menandatangani surat proposal anggota secara berjenjang sebelum diserahkan ke Wakil Dekan 3.
            </p>

            {/* Quick Action Pill Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/ketua-organisasi/ruangan"
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-blue-700 hover:bg-amber-50 active:scale-95 shadow-md transition-all flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Cari &amp; Pinjam Ruangan</span>
              </Link>
              <Link
                href="/dashboard/ketua-organisasi/tanda-tangan"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Antrean TTD ({totalPending})</span>
              </Link>
              <Link
                href="/dashboard/ketua-organisasi/peminjaman"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs border border-white/25 transition-all"
              >
                Pantau Pengajuan Saya
              </Link>
            </div>
          </div>

          {/* Right Mascot Illustration & Warm Speech Bubble */}
          <div className="relative flex items-center justify-center lg:justify-end shrink-0 pt-2 lg:pt-0">
            <div className="hidden xl:block absolute -top-4 -left-16 bg-white/95 text-slate-800 px-3.5 py-1.5 rounded-2xl rounded-br-xs shadow-lg border border-amber-200 text-xs font-bold z-20 animate-pulse">
              Halo Ketua {profile.nama.split(" ")[0]}! Siap proses suratmu 🕊️✉️
            </div>
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 drop-shadow-2xl hover:scale-105 transition-transform duration-300">
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

      {/* Security Rule Notice: 1 Active Submission Limit */}
      {isSubmissionActive && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
              Pengajuan Pribadi Sedang Berjalan ({activeLoan.nomor_pengajuan})
            </h4>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Anda memiliki 1 permohonan peminjaman ruangan yang sedang diproses. Mohon tunggu proses selesai sebelum mengajukan ruangan lain.
            </p>
          </div>
          <Link
            href="/dashboard/ketua-organisasi/peminjaman"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline shrink-0 mt-0.5"
          >
            Lihat Status
          </Link>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Menunggu TTD Ketua */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <PenTool className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Menunggu TTD Anda</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-1">
            {totalPending}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Proposal anggota ormawa</p>
        </div>

        {/* Card 2: Pengajuan Pribadi Aktif */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Pengajuan Pribadi</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight mt-1">
            {isSubmissionActive ? 1 : 0}
          </p>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">
            {isSubmissionActive ? "1 pengajuan aktif" : "Belum ada pengajuan"}
          </p>
        </div>

        {/* Card 3: Ruangan Tersedia */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Ruangan Tersedia</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {tersediaCount}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Siap untuk dipinjam</p>
        </div>

        {/* Card 4: Organisasi */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Organisasi Anda</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-violet-700 tracking-tight mt-1 truncate">
            {org?.singkatan || "ORMAWA"}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {org?.nama || "Terdaftar di Fakultas"}
          </p>
        </div>
      </div>

      {/* SECTION 1: Antrean Pengajuan Anggota Organisasi Siap TTD */}
      <div id="antrean-ttd" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Pengajuan Anggota yang Menunggu Tanda Tangan Anda</span>
              {totalPending > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {totalPending} Perlu TTD
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verifikasi dan bubuhkan tanda tangan digital pada proposal sebelum diteruskan ke Wakil Dekan 3
            </p>
          </div>
          <Link
            href="/dashboard/ketua-organisasi/tanda-tangan"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>Buka Panel TTD</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {!pendingRequests || pendingRequests.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">Tidak ada proposal tertunda</p>
                <p className="text-xs text-slate-400 mt-1">
                  Seluruh surat kegiatan anggota organisasi Anda telah selesai ditandatangani.
                </p>
              </div>
            ) : (
              pendingRequests.slice(0, 5).map((req: any) => (
                <div
                  key={req.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
                        {req.nomor_pengajuan}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        Pemohon: {req.pemohon?.nama} {req.pemohon?.nim ? `(${req.pemohon.nim})` : ""}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {req.nama_kegiatan}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        Ruang {req.ruangan?.kode} • {req.ruangan?.gedung?.nama || "Gedung Fakultas"} (Lt. {req.ruangan?.lantai})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Waktu: {new Date(req.tanggal_mulai).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/ketua-organisasi/tanda-tangan?id=${req.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-2xs"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Tinjau &amp; Tanda Tangan</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Pengajuan Pribadi Terkini Saya (Fitur Pinjam Ruangan Seperti Mahasiswa) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Pengajuan Peminjaman Pribadi Saya
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau tahapan verifikasi berkas permohonan peminjaman ruangan yang Anda ajukan
            </p>
          </div>
          <Link
            href="/dashboard/ketua-organisasi/peminjaman"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>Semua Pengajuan Pribadi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeLoan ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="w-full md:w-44 h-28 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0">
              {activeLoan.ruangan?.url_foto ? (
                <img
                  src={activeLoan.ruangan.url_foto}
                  alt={`Ruang ${activeLoan.ruangan.kode}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                {activeLoan.ruangan?.kode || "Ruangan"}
              </span>
            </div>

            <div className="flex-1 min-w-0 w-full space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 uppercase px-2 py-0.5 rounded-md tracking-wider">
                  {activeLoan.nomor_pengajuan}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                  {STATUS_LABEL[activeLoan.status] || activeLoan.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                {activeLoan.nama_kegiatan}
              </h3>

              <p className="text-xs text-slate-500">
                Ruang {activeLoan.ruangan?.kode} • {activeLoan.ruangan?.gedung?.nama || "Fakultas"} (Lantai {activeLoan.ruangan?.lantai})
              </p>

              {/* Progress Bar */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Progres Persetujuan</span>
                  <span className="font-bold text-indigo-600">
                    {STATUS_STEP_PERCENT[activeLoan.status] ?? 25}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${STATUS_STEP_PERCENT[activeLoan.status] || 25}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/ketua-organisasi/peminjaman"
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shrink-0"
            >
              <span>Detail Alur</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Tidak Ada Pengajuan Pribadi Berjalan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Butuh ruangan kelas atau aula untuk agenda ormawa atau kegiatan akademik Anda?
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/ketua-organisasi/ruangan"
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shrink-0"
            >
              Ajukan Ruangan Baru
            </Link>
          </div>
        )}
      </div>

      {/* SECTION 3: Rekomendasi Ruangan Kampus (Fitur Pinjam Ruangan) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Rekomendasi Ruangan Fakultas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cek fasilitas dan ajukan ruangan yang tersedia untuk kegiatan Anda
            </p>
          </div>
          <Link
            href="/dashboard/ketua-organisasi/ruangan"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
          >
            <span>Lihat Semua Ruangan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendedRooms.map((room) => {
            const isAvailable = room.statusKetersediaan === "tersedia";
            const isHeld = room.statusKetersediaan === "ditahan";

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  {room.url_foto ? (
                    <img
                      src={room.url_foto}
                      alt={`Ruang ${room.kode}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-indigo-50 flex items-center justify-center text-slate-300">
                      <Building2 className="w-10 h-10" />
                    </div>
                  )}

                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/60 shadow-2xs ${
                      isAvailable
                        ? "bg-emerald-500 text-white"
                        : isHeld
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {isAvailable ? "Tersedia" : isHeld ? "Sedang Diajukan" : "Sedang Digunakan"}
                  </span>

                  <span className="absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-xl bg-black/60 text-white backdrop-blur-md">
                    {room.kode}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {room.gedungNama}
                    </span>
                    <span className="text-xs text-slate-400">Lantai {room.lantai}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 leading-snug">
                    Ruang {room.kode}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {room.deskripsi || "Ruangan perkuliahan dan kegiatan akademik fakultas."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {room.kapasitas} mhs
                      </span>
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
                        href={`/dashboard/ketua-organisasi/peminjaman/baru?ruangan=${room.id}`}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        Ajukan Pinjam
                      </Link>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                        {isHeld ? "Sedang Diajukan" : "Tidak Tersedia"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: AI Asisten Pencarian Ruangan */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            AI Asisten Pencarian Ruangan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Konsultasikan kebutuhan kegiatan Anda, AI akan menganalisis database kapasitas, fasilitas, dan ketersediaan ruangan
          </p>
        </div>
        <AIPencarian />
      </div>
    </div>
  );
}
