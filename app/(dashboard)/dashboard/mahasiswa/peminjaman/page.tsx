import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, Clock, CheckCircle2, XCircle, FileText, Building2, Calendar, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  menunggu_upload: {
    label: "Menunggu Upload Dokumen",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
  menunggu_ketua: {
    label: "Menunggu TTD Ketua",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: Clock,
  },
  menunggu_wd3: {
    label: "Menunggu TTD WD3",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Clock,
  },
  disetujui: {
    label: "Disetujui & Sah",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  ditolak_ketua: {
    label: "Ditolak Ketua Org",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
  },
  ditolak_wd3: {
    label: "Ditolak WD3",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
  },
  dibatalkan: {
    label: "Dibatalkan",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: XCircle,
  },
  kedaluwarsa: {
    label: "Kedaluwarsa",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: Clock,
  },
};

const TIMELINE_STEPS_UMUM = [
  "Pengajuan Dibuat",
  "Menunggu TTD WD3",
  "Disetujui & Sah",
];

const TIMELINE_STEPS_ORGANISASI = [
  "Pengajuan Dibuat",
  "Menunggu TTD Ketua Org",
  "Menunggu TTD WD3",
  "Disetujui & Sah",
];

const STATUS_TO_STEP: Record<string, Record<string, number>> = {
  umum: {
    menunggu_upload: 0,
    menunggu_wd3: 1,
    disetujui: 2,
    ditolak_wd3: -1,
  },
  organisasi: {
    menunggu_upload: 0,
    menunggu_ketua: 1,
    menunggu_wd3: 2,
    disetujui: 3,
    ditolak_ketua: -1,
    ditolak_wd3: -1,
  },
};

export default async function StatusPeminjamanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Query tabel pengajuan dengan relasi eksplisit
  const { data: pengajuanList } = await supabase
    .from("pengajuan")
    .select(`
      id,
      nomor_pengajuan,
      nama_kegiatan,
      deskripsi_kegiatan,
      jumlah_peserta,
      tanggal_mulai,
      tanggal_selesai,
      status,
      alasan_penolakan,
      jenis_peminjaman,
      created_at,
      ruangan:ruangan!pengajuan_ruangan_id_fkey (
        kode,
        lantai,
        gedung:gedung!ruangan_gedung_id_fkey (nama)
      ),
      organisasi:organisasi!pengajuan_organisasi_id_fkey (
        nama,
        singkatan
      ),
      dokumen_pengajuan:dokumen_pengajuan!dokumen_pengajuan_pengajuan_id_fkey (
        id,
        url_file,
        nama_file,
        status_dokumen
      ),
      riwayat_status:riwayat_status!riwayat_status_pengajuan_id_fkey (
        status_baru,
        catatan,
        created_at,
        aktor:users!riwayat_status_aktor_id_fkey (nama)
      )
    `)
    .eq("pemohon_id", user.id)
    .order("created_at", { ascending: false });

  const list = pengajuanList || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Status Peminjaman</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau perkembangan pengajuan ruangan Anda secara real-time</p>
        </div>
        <Link
          href="/dashboard/mahasiswa/ruangan"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all shadow-xs"
        >
          Ajukan Peminjaman Baru
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-700 text-lg">Tidak ada pengajuan aktif</p>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Anda belum memiliki pengajuan peminjaman yang sedang berjalan. Mulai dari halaman Daftar Ruangan.
          </p>
          <Link
            href="/dashboard/mahasiswa/ruangan"
            className="inline-block mt-6 px-6 py-2.5 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Cari Ruangan
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {list.map((p: any) => {
            const statusCfg = STATUS_CONFIG[p.status] || {
              label: p.status,
              color: "text-slate-600",
              bg: "bg-slate-50",
              border: "border-slate-200",
              icon: Clock,
            };
            const StatusIcon = statusCfg.icon;
            const isOrg = p.jenis_peminjaman === "organisasi";
            const steps = isOrg ? TIMELINE_STEPS_ORGANISASI : TIMELINE_STEPS_UMUM;
            const stepMap = STATUS_TO_STEP[isOrg ? "organisasi" : "umum"];
            const isRejected = p.status.startsWith("ditolak");
            const currentStep = isRejected ? -1 : (stepMap[p.status] ?? 0);
            const doc = p.dokumen_pengajuan?.[0];

            return (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {p.nama_kegiatan}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.nomor_pengajuan} • Ruang {p.ruangan?.kode} ({p.ruangan?.gedung?.nama})
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                        isOrg
                          ? "bg-violet-50 text-violet-600 border border-violet-200"
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}
                    >
                      {isOrg ? `Organisasi (${p.organisasi?.singkatan || "Lembaga"})` : "Umum"}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Info row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Mulai</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {new Date(p.tanggal_mulai).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Selesai</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {new Date(p.tanggal_selesai).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Peserta</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {p.jumlah_peserta} Orang
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dokumen Surat</p>
                      {doc ? (
                        <a
                          href={doc.url_file}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center gap-1"
                        >
                          <span>Unduh Surat</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">Belum diunggah</p>
                      )}
                    </div>
                  </div>

                  {/* Penolakan note */}
                  {isRejected && p.alasan_penolakan && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                      <p className="text-xs font-bold text-rose-700 mb-0.5">Catatan Alasan Penolakan:</p>
                      <p className="text-xs text-rose-600 leading-relaxed">{p.alasan_penolakan}</p>
                    </div>
                  )}

                  {/* Timeline Progress */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-3">Progres Verifikasi</p>
                    {isRejected ? (
                      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <p className="text-xs text-rose-700 font-medium">
                          Pengajuan ditolak. Silakan periksa catatan alasan penolakan di atas.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {steps.map((step, idx) => {
                          const done = idx < currentStep;
                          const active = idx === currentStep;
                          return (
                            <React.Fragment key={step}>
                              <div className="flex items-center gap-2 shrink-0">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    done
                                      ? "bg-indigo-600 text-white"
                                      : active
                                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {done ? "✓" : idx + 1}
                                </div>
                                <span
                                  className={`text-xs ${
                                    active
                                      ? "font-bold text-indigo-700"
                                      : done
                                      ? "font-medium text-slate-700"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {step}
                                </span>
                              </div>
                              {idx < steps.length - 1 && (
                                <div
                                  className={`h-0.5 w-8 shrink-0 ${
                                    done ? "bg-indigo-600" : "bg-slate-200"
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
