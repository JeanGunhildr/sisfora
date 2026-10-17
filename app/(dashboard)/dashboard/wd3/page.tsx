import React from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Link from "next/link";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  Calendar,
  Users,
  Eye,
  AlertCircle,
  FileText,
  History,
} from "lucide-react";
import { getRelevantDokumen } from "@/lib/wd3";

export default async function WD3Dashboard() {
  const { user, profile } = await requireRole(["wd3"]);
  const supabase = await createClient();

  // Fetch all pengajuan with explicit foreign key relations to avoid PGRST201 ambiguity
  const { data: allPengajuan } = await supabase
    .from("pengajuan")
    .select(`
      *,
      pemohon:users!pengajuan_pemohon_id_fkey (
        id,
        nama,
        nim,
        email
      ),
      ruangan:ruangan!pengajuan_ruangan_id_fkey (
        id,
        kode,
        kapasitas,
        gedung:gedung!ruangan_gedung_id_fkey (
          id,
          nama
        )
      ),
      organisasi:organisasi!pengajuan_organisasi_id_fkey (
        id,
        nama,
        singkatan
      ),
      dokumen_pengajuan:dokumen_pengajuan!dokumen_pengajuan_pengajuan_id_fkey (
        id,
        url_file,
        status_dokumen,
        nama_file,
        updated_at
      )
    `)
    .order("created_at", { ascending: false });

  const rawList = allPengajuan || [];

  // Filter items waiting for WD3 signature according to the strict business workflow:
  // - Umum: status === 'menunggu_wd3' dan dokumen terunggah
  // - Organisasi: status === 'menunggu_wd3' dan dokumen sudah ditandatangani ketua ('ditandatangani_ketua')
  const pendingForWD3 = rawList.filter((item: any) => {
    // Exclude decided / cancelled
    if (
      item.status === "disetujui" ||
      item.status === "ditolak_wd3" ||
      item.status === "ditolak_ketua" ||
      item.status === "dibatalkan" ||
      item.status === "kedaluwarsa"
    ) {
      return false;
    }

    // Must have document and cannot be waiting for upload
    const doc = getRelevantDokumen(item);
    if (!doc || item.status === "menunggu_upload") {
      return false;
    }

    const isOrganisasi =
      item.jenis_peminjaman === "organisasi" || Boolean(item.organisasi_id);

    if (isOrganisasi) {
      // Hanya tampil jika sudah ditandatangani Ketua Organisasi
      const isSignedByKetua = doc.status_dokumen === "ditandatangani_ketua";
      return isSignedByKetua && item.status === "menunggu_wd3";
    }

    // Umum
    return item.status === "menunggu_wd3" || doc.status_dokumen === "diunggah";
  });

  const approvedCount = rawList.filter((p: any) => p.status === "disetujui").length;
  const rejectedCount = rawList.filter(
    (p: any) => p.status === "ditolak_wd3" || p.status === "ditolak_ketua"
  ).length;
  const totalCount = rawList.length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <DashboardHeader
        nama={profile.nama}
        roleTitle="Wakil Dekan 3 (Bidang Kemahasiswaan)"
        role="wd3"
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Persetujuan &amp; Tanda Tangan Digital Fakultas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Portal Persetujuan Surat Wakil Dekan 3
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Selamat datang di panel pengesahan surat peminjaman sarana &amp; prasarana. Tinjau permohonan umum serta permohonan organisasi yang telah diverifikasi oleh Ketua Organisasi, bubuhkan tanda tangan digital resmi, dan pantau arsip riwayat pengajuan.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/wd3/persetujuan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Buka Antrean Persetujuan ({pendingForWD3.length})</span>
            </Link>
            <Link
              href="/dashboard/wd3/riwayat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs transition-all"
            >
              <History className="w-4 h-4" />
              <span>Lihat Riwayat Arsip</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Menunggu TTD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            {pendingForWD3.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                Perlu Tindakan
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-400 mt-3">Menunggu Tanda Tangan</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-1">
            {pendingForWD3.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Permohonan siap ditandatangani</p>
        </div>

        {/* Card 2: Total Disetujui */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 mt-3">Total Disetujui</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight mt-1">
            {approvedCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Surat sah &amp; diterbitkan</p>
        </div>

        {/* Card 3: Total Ditolak */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 mt-3">Total Ditolak</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight mt-1">
            {rejectedCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Tidak memenuhi persyaratan</p>
        </div>

        {/* Card 4: Total Permohonan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400 mt-3">Total Seluruh Permohonan</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight mt-1">
            {totalCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Kumulatif data permohonan</p>
        </div>
      </div>

      {/* Pending List Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Antrean Permohonan Siap Tanda Tangan
              </h2>
              {pendingForWD3.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {pendingForWD3.length} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hanya menampilkan surat kategori umum &amp; organisasi yang telah diverifikasi Ketua Organisasi
            </p>
          </div>

          <Link
            href="/dashboard/wd3/persetujuan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Buka Halaman Persetujuan Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingForWD3.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Semua Surat Telah Selesai Diproses</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Saat ini tidak ada permohonan peminjaman ruangan yang menunggu persetujuan atau tanda tangan dari Anda.
              </p>
            </div>
          ) : (
            pendingForWD3.slice(0, 5).map((req: any) => {
              const isOrganisasi =
                req.jenis_peminjaman === "organisasi" || Boolean(req.organisasi_id);
              const tglMulai = new Date(req.tanggal_mulai).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const tglPengajuan = req.created_at
                ? new Date(req.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "-";

              return (
                <div
                  key={req.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isOrganisasi
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {isOrganisasi ? `Organisasi (${req.organisasi?.singkatan || "UKM"})` : "Umum"}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {req.pemohon?.nama || "Pemohon"} {req.pemohon?.nim ? `(${req.pemohon.nim})` : ""}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • Diajukan: {tglPengajuan}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {req.nama_kegiatan || req.keperluan || "Kegiatan Mahasiswa"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        Ruang {req.ruangan?.kode || "-"} — {req.ruangan?.gedung?.nama || "Gedung"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Pelaksanaan: {tglMulai}
                      </span>
                      {isOrganisasi && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Sudah ditandatangani Ketua
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/wd3/persetujuan`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-xs active:scale-95"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Tinjau &amp; Tanda Tangan</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {pendingForWD3.length > 5 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/wd3/persetujuan"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Lihat seluruh {pendingForWD3.length} permohonan antrean &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}