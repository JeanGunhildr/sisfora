import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, Clock, CheckCircle2, XCircle, FileText, Building2 } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  menunggu_wd3: {
    label: "Menunggu WD3",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Clock,
  },
  menunggu_ketua: {
    label: "Menunggu Ketua Org",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: Clock,
  },
  disetujui_ketua: {
    label: "Disetujui Ketua",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: CheckCircle2,
  },
  disetujui_wd3: {
    label: "Disetujui WD3",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  berlangsung: {
    label: "Berlangsung",
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    icon: CheckCircle2,
  },
  selesai: {
    label: "Selesai",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: CheckCircle2,
  },
  ditolak: {
    label: "Ditolak",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: XCircle,
  },
};

const TIMELINE_STEPS_UMUM = [
  "Pengajuan Dikirim",
  "Menunggu WD3",
  "Disetujui WD3",
  "Berlangsung",
  "Selesai",
];

const TIMELINE_STEPS_ORGANISASI = [
  "Pengajuan Dikirim",
  "Menunggu Ketua Org",
  "Disetujui Ketua",
  "Menunggu WD3",
  "Disetujui WD3",
  "Berlangsung",
  "Selesai",
];

const STATUS_TO_STEP: Record<string, Record<string, number>> = {
  umum: {
    menunggu_wd3: 1,
    disetujui_wd3: 2,
    berlangsung: 3,
    selesai: 4,
    ditolak: -1,
  },
  organisasi: {
    menunggu_ketua: 1,
    disetujui_ketua: 2,
    menunggu_wd3: 3,
    disetujui_wd3: 4,
    berlangsung: 5,
    selesai: 6,
    ditolak: -1,
  },
};

export default async function StatusPeminjamanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: peminjaman } = await supabase
    .from("peminjaman")
    .select(`
      id, status, kategori, tanggal_mulai, tanggal_selesai, waktu_mulai, waktu_selesai,
      keperluan, url_surat, created_at, alasan_penolakan,
      ruangan(nama, kode, lantai, gedung(nama)),
      log_peminjaman(status, catatan, created_at, updated_by(nama))
    `)
    .eq("pemohon_id", user.id)
    .not("status", "eq", "selesai")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Status Peminjaman</h1>
        <p className="text-sm text-slate-500 mt-1">Pantau perkembangan pengajuan ruangan Anda secara real-time</p>
      </div>

      {!peminjaman || peminjaman.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-700 text-lg">Tidak ada pengajuan aktif</p>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Anda belum memiliki pengajuan peminjaman yang sedang berjalan. Mulai dari halaman Daftar Ruangan.
          </p>
          <a
            href="/dashboard/mahasiswa/ruangan"
            className="inline-block mt-6 px-6 py-2.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Cari Ruangan
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {peminjaman.map((p: any) => {
            const statusCfg = STATUS_CONFIG[p.status] || {
              label: p.status,
              color: "text-slate-600",
              bg: "bg-slate-50",
              border: "border-slate-200",
              icon: Clock,
            };
            const StatusIcon = statusCfg.icon;
            const isOrg = p.kategori === "organisasi";
            const steps = isOrg ? TIMELINE_STEPS_ORGANISASI : TIMELINE_STEPS_UMUM;
            const stepMap = STATUS_TO_STEP[isOrg ? "organisasi" : "umum"];
            const currentStep = p.status === "ditolak" ? -1 : (stepMap[p.status] ?? 0);

            return (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{p.ruangan?.nama}</h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.ruangan?.kode} • {p.ruangan?.gedung?.nama} • Lantai {p.ruangan?.lantai}
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
                      {isOrg ? "Organisasi" : "Umum"}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Info row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Mulai</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {p.tanggal_mulai
                          ? new Date(p.tanggal_mulai).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Selesai</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {p.tanggal_selesai
                          ? new Date(p.tanggal_selesai).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Waktu</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {p.waktu_mulai && p.waktu_selesai
                          ? `${p.waktu_mulai.slice(0, 5)} – ${p.waktu_selesai.slice(0, 5)}`
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Keperluan</p>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">{p.keperluan || "-"}</p>
                    </div>
                  </div>

                  {/* Penolakan note */}
                  {p.status === "ditolak" && p.alasan_penolakan && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                      <p className="text-xs font-semibold text-rose-700 mb-0.5">Alasan Penolakan:</p>
                      <p className="text-xs text-rose-600">{p.alasan_penolakan}</p>
                    </div>
                  )}

                  {/* Timeline Progress */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-3">Progres Pengajuan</p>
                    {currentStep === -1 ? (
                      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <p className="text-xs text-rose-700 font-medium">Pengajuan telah ditolak</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0">
                        {steps.map((step, idx) => {
                          const done = idx < currentStep;
                          const active = idx === currentStep;
                          return (
                            <React.Fragment key={step}>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    done
                                      ? "bg-blue-600 text-white"
                                      : active
                                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {done ? "✓" : idx + 1}
                                </div>
                                <p
                                  className={`text-[9px] mt-1 text-center max-w-[60px] font-medium ${
                                    active ? "text-blue-700" : done ? "text-slate-600" : "text-slate-400"
                                  }`}
                                >
                                  {step}
                                </p>
                              </div>
                              {idx < steps.length - 1 && (
                                <div
                                  className={`h-0.5 flex-1 mb-4 ${
                                    idx < currentStep ? "bg-blue-500" : "bg-slate-200"
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Log entries */}
                  {p.log_peminjaman && p.log_peminjaman.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-2">Riwayat Aktivitas</p>
                      <div className="space-y-2">
                        {[...p.log_peminjaman]
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          )
                          .slice(0, 5)
                          .map((log: any, i: number) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-[11px] text-slate-700 font-medium">
                                  {STATUS_CONFIG[log.status]?.label || log.status}
                                  {log.catatan && (
                                    <span className="text-slate-500 font-normal"> — {log.catatan}</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(log.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {log.updated_by?.nama && ` · ${log.updated_by.nama}`}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Surat Link */}
                  {p.url_surat && (
                    <a
                      href={p.url_surat}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <FileText size={14} />
                      Lihat Surat Permohonan
                    </a>
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
