import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  Users,
  Download,
  Upload,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  menunggu_upload: {
    label: "Menunggu Unggah Berkas",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
  menunggu_ketua: {
    label: "Menunggu TTD Ketua Org",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: Clock,
  },
  menunggu_wd3: {
    label: "Menunggu Persetujuan WD3",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Clock,
  },
  disetujui: {
    label: "Disetujui Dekanat",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  ditolak_ketua: {
    label: "Ditolak Ketua Organisasi",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
  },
  ditolak_wd3: {
    label: "Ditolak Wakil Dekan 3",
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
    label: "Waktu Kedaluwarsa",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: Clock,
  },
};

const TIMELINE_STEPS_UMUM = [
  "Pengajuan Dibuat",
  "Unggah Dokumen Surat",
  "Persetujuan WD3",
  "Disetujui & Terbit",
];

const TIMELINE_STEPS_ORGANISASI = [
  "Pengajuan Dibuat",
  "Unggah Dokumen Surat",
  "TTD Ketua Organisasi",
  "Persetujuan WD3",
  "Disetujui & Terbit",
];

const STATUS_TO_STEP: Record<string, Record<string, number>> = {
  umum: {
    menunggu_upload: 1,
    menunggu_wd3: 2,
    disetujui: 3,
    ditolak_wd3: -1,
    dibatalkan: -1,
    kedaluwarsa: -1,
  },
  organisasi: {
    menunggu_upload: 1,
    menunggu_ketua: 2,
    menunggu_wd3: 3,
    disetujui: 4,
    ditolak_ketua: -1,
    ditolak_wd3: -1,
    dibatalkan: -1,
    kedaluwarsa: -1,
  },
};

export default async function StatusPeminjamanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: pengajuanList } = await supabase
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
        gedung:gedung_id(id, nama)
      ),
      organisasi:organisasi_id(id, nama, singkatan),
      dokumen_pengajuan(id, nama_file, url_file, status_dokumen, updated_at),
      riwayat_status(id, status_sebelumnya, status_baru, catatan, created_at, aktor:aktor_id(nama))
    `)
    .eq("pemohon_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Status Peminjaman</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau perkembangan tahapan dan verifikasi surat pengajuan Anda</p>
        </div>
        <Link
          href="/dashboard/mahasiswa/ruangan"
          className="self-start sm:self-auto px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
        >
          + Ajukan Ruangan Baru
        </Link>
      </div>

      {!pengajuanList || pengajuanList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8" />
          </div>
          <p className="font-bold text-slate-700 text-lg">Belum Ada Pengajuan Peminjaman</p>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Anda belum memiliki riwayat pengajuan peminjaman ruangan. Pilih ruangan yang tersedia dan ajukan jadwal kegiatan Anda.
          </p>
          <Link
            href="/dashboard/mahasiswa/ruangan"
            className="inline-block mt-6 px-6 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Cari Ruangan Tersedia
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {pengajuanList.map((p: any) => {
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
            const stepMap = STATUS_TO_STEP[isOrg ? "organisasi" : "umum"] || {};
            const isRejected = p.status.includes("ditolak") || p.status === "dibatalkan" || p.status === "kedaluwarsa";
            const currentStep = isRejected ? -1 : (stepMap[p.status] ?? 0);

            const activeDoc = p.dokumen_pengajuan?.[0] || null;

            return (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base">{p.nama_kegiatan}</h3>
                        <span className="text-xs font-mono text-slate-400">({p.nomor_pengajuan})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Ruang <strong>{p.ruangan?.kode}</strong> • {p.ruangan?.gedung?.nama || "Fakultas"} (Lantai {p.ruangan?.lantai})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        isOrg
                          ? "bg-violet-50 text-violet-700 border border-violet-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isOrg ? `Organisasi • ${p.organisasi?.singkatan || p.organisasi?.nama || "ORMAWA"}` : "Umum"}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Info Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3.5">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Mulai</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {p.tanggal_mulai
                          ? new Date(p.tanggal_mulai).toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-medium">
                        {new Date(p.tanggal_mulai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Selesai</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {p.tanggal_selesai
                          ? new Date(p.tanggal_selesai).toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-medium">
                        {new Date(p.tanggal_selesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Peserta</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{p.jumlah_peserta} orang</p>
                      <p className="text-[11px] text-slate-400">Kapasitas ruangan</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dokumen Surat</p>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {activeDoc ? activeDoc.nama_file : "Belum diunggah"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {activeDoc?.status_dokumen || "Menunggu berkas"}
                      </p>
                    </div>
                  </div>

                  {/* Catatan Alasan Penolakan Jika Ada */}
                  {isRejected && p.alasan_penolakan && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-800">Alasan Penolakan / Pembatalan:</p>
                        <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{p.alasan_penolakan}</p>
                      </div>
                    </div>
                  )}

                  {/* Step Timeline */}
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                      Progres Alur Persetujuan
                    </p>
                    {currentStep === -1 ? (
                      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <p className="text-xs text-rose-700 font-medium">
                          Pengajuan ini berstatus {statusCfg.label.toLowerCase()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                        {steps.map((step, idx) => {
                          const done = idx < currentStep;
                          const active = idx === currentStep;
                          return (
                            <React.Fragment key={step}>
                              <div className="flex flex-col items-center shrink-0">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                                    done
                                      ? "bg-indigo-600 text-white"
                                      : active
                                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <p
                                  className={`text-[10px] mt-2 text-center max-w-[85px] font-semibold leading-tight ${
                                    active ? "text-indigo-600" : done ? "text-slate-700" : "text-slate-400"
                                  }`}
                                >
                                  {step}
                                </p>
                              </div>
                              {idx < steps.length - 1 && (
                                <div
                                  className={`h-0.5 flex-1 mx-2 mb-6 transition-all ${
                                    idx < currentStep ? "bg-indigo-600" : "bg-slate-200"
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Riwayat Status Log dari Database */}
                  {p.riwayat_status && p.riwayat_status.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                        Riwayat Aktivitas & Tanda Tangan
                      </p>
                      <div className="space-y-2.5">
                        {p.riwayat_status.map((log: any) => (
                          <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 text-xs">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">
                                {STATUS_CONFIG[log.status_baru]?.label || log.status_baru}
                                {log.catatan && <span className="font-normal text-slate-500"> — {log.catatan}</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(log.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {log.aktor?.nama && ` · ${log.aktor.nama}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dokumen Actions */}
                  {activeDoc && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Dokumen Terkini: {activeDoc.nama_file}</span>
                      </div>
                      <a
                        href={activeDoc.url_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Surat ({activeDoc.status_dokumen})</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
