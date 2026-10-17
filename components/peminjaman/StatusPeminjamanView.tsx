import React from "react";
import Image from "next/image";
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

interface StatusPeminjamanViewProps {
  pengajuanList: any[];
  role: "mahasiswa" | "ketua_organisasi";
}

export default function StatusPeminjamanView({
  pengajuanList,
  role = "mahasiswa",
}: StatusPeminjamanViewProps) {
  const hasActiveSubmission = (pengajuanList || []).some((p: any) =>
    ["menunggu_upload", "menunggu_ketua", "menunggu_wd3"].includes(p.status) ||
    (p.status === "disetujui" && new Date(p.tanggal_selesai) > new Date())
  );

  const ruanganPath =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/ruangan"
      : "/dashboard/mahasiswa/ruangan";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Status Peminjaman</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau perkembangan tahapan dan verifikasi surat pengajuan Anda</p>
        </div>
        {hasActiveSubmission ? (
          <div className="self-start sm:self-auto flex items-center gap-2">
            <span
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
              title="Anda sedang memiliki 1 pengajuan peminjaman aktif. Maksimal 1 ruangan dalam satu waktu."
            >
              <span>+ Ajukan Ruangan Baru</span>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                Ada Pengajuan Aktif
              </span>
            </span>
          </div>
        ) : (
          <Link
            href={ruanganPath}
            className="self-start sm:self-auto px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            + Ajukan Ruangan Baru
          </Link>
        )}
      </div>

      {hasActiveSubmission && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-amber-950">
              Pengajuan Peminjaman Aktif Sedang Berjalan
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Anda memiliki pengajuan peminjaman ruangan yang sedang diproses. Demi keadilan dan pencegahan pemesanan ganda (spam), tombol pengajuan ruangan baru dinonaktifkan sementara sampai pengajuan aktif selesai atau dibatalkan.
            </p>
          </div>
        </div>
      )}

      {!pengajuanList || pengajuanList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-amber-100/80 shadow-xs p-12 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3 drop-shadow-md">
            <Image
              src="/maskot1.png"
              alt="Merpi"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          <p className="font-bold text-slate-800 text-lg">Belum Ada Pengajuan Peminjaman</p>
          <p className="text-xs text-amber-800/80 mt-1 max-w-sm mx-auto leading-relaxed">
            Anda belum memiliki riwayat pengajuan peminjaman ruangan. Si Merpi siap antar berkas permohonanmu kalau kamu mau pinjam ruangan!
          </p>
          <Link
            href={ruanganPath}
            className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-700 via-sky-600 to-amber-500 hover:from-blue-800 hover:to-amber-600 text-white transition-all shadow-md shadow-sky-500/20 active:scale-95"
          >
            <span>Cari Ruangan Tersedia</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
            const currentStepIdx = stepMap[p.status] ?? 0;
            const doc = p.dokumen_pengajuan?.[0];

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-6 transition-all hover:border-slate-200"
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {p.nomor_pengajuan}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {isOrg ? `Organisasi • ${p.organisasi?.singkatan || p.organisasi?.nama || "ORMAWA"}` : "Umum"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {p.nama_kegiatan}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusCfg.label}</span>
                  </span>
                </div>

                {/* Info Ruangan & Jadwal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block mb-0.5">Ruangan</span>
                    <span className="font-bold text-slate-800">
                      {p.ruangan?.kode} — {p.ruangan?.gedung?.nama || "Gedung"}
                    </span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      Lantai {p.ruangan?.lantai || 1} • {p.jumlah_peserta} Peserta
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block mb-0.5">Waktu Mulai</span>
                    <span className="font-bold text-slate-800">
                      {new Date(p.tanggal_mulai).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      Pukul {new Date(p.tanggal_mulai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block mb-0.5">Waktu Selesai</span>
                    <span className="font-bold text-slate-800">
                      {new Date(p.tanggal_selesai).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      Pukul {new Date(p.tanggal_selesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>
                </div>

                {/* Alasan Penolakan Alert jika ditolak */}
                {isRejected && p.alasan_penolakan && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Catatan Penolakan: </span>
                      <span>{p.alasan_penolakan}</span>
                    </div>
                  </div>
                )}

                {/* Stepper Progres */}
                {!isRejected && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      Tahapan Alur Persetujuan
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {steps.map((st, sIdx) => {
                        const isDone = sIdx < currentStepIdx;
                        const isCurrent = sIdx === currentStepIdx;

                        return (
                          <div
                            key={sIdx}
                            className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 transition-all ${
                              isDone
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : isCurrent
                                ? "bg-indigo-50 border-indigo-200 text-indigo-800 ring-2 ring-indigo-500/20"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isDone
                                  ? "bg-emerald-600 text-white"
                                  : isCurrent
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {isDone ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                            </div>
                            <span className="font-semibold text-[11px] line-clamp-1">{st}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dokumen Surat Section */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {doc ? (
                      <span>
                        Dokumen: <strong className="text-slate-800">{doc.nama_file}</strong>
                        {doc.status_dokumen === "ditandatangani_wd3" || doc.status_dokumen === "final" ? (
                          <span className="ml-2 font-bold text-emerald-600">(Sudah Ditandatangani WD3)</span>
                        ) : doc.status_dokumen === "ditandatangani_ketua" ? (
                          <span className="ml-2 font-bold text-violet-600">(Sudah Ditandatangani Ketua Ormawa)</span>
                        ) : (
                          <span className="ml-2 text-slate-400">(Versi Pengajuan Awal)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-amber-600">Belum ada berkas surat permohonan diunggah.</span>
                    )}
                  </div>

                  {doc?.url_file && (
                    <a
                      href={doc.url_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen Surat</span>
                    </a>
                  )}
                </div>

                {/* Riwayat Status Log */}
                {p.riwayat_status?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Catatan &amp; Jejak Verifikasi
                    </span>
                    <div className="space-y-1.5">
                      {p.riwayat_status.map((log: any) => (
                        <div key={log.id} className="text-xs text-slate-500 flex items-start gap-2">
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                            {new Date(log.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>•</span>
                          <span>{log.catatan}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
