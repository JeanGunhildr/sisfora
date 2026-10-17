import React from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Link from "next/link";
import { PenTool, Building2, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export default async function KetuaOrganisasiDashboard() {
  const { user, profile } = await requireRole(["ketua_organisasi"]);
  const supabase = await createClient();

  // Fetch organisasi info
  const { data: org } = await supabase
    .from("organisasi")
    .select("id, nama, singkatan")
    .eq("ketua_id", user.id)
    .single();

  // Fetch requests pending ketua organisasi approval
  const { data: pendingRequests } = await supabase
    .from("peminjaman")
    .select(`
      id, status, kategori, tanggal_mulai, tanggal_selesai, waktu_mulai, waktu_selesai,
      keperluan, created_at,
      pemohon:users!pemohon_id(nama, nim, email),
      ruangan(nama, kode, lantai, gedung(nama))
    `)
    .eq("kategori", "organisasi")
    .eq("status", "menunggu_ketua")
    .order("created_at", { ascending: false });

  const totalPending = pendingRequests?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <DashboardHeader
        nama={profile.nama}
        roleTitle={`Ketua Organisasi ${org?.singkatan ? `(${org.singkatan})` : ""}`}
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>{org?.nama || "Organisasi Kemahasiswaan"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Persetujuan Proposal Acara Organisasi
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed">
            Periksa kesesuaian anggota dan keperluan acara sebelum menandatangani surat permohonan untuk diteruskan ke Wakil Dekan 3.
          </p>
        </div>
      </div>

      {/* Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Menunggu Tanda Tangan Anda</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-1">
            {totalPending} Pengajuan
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Organisasi Terdaftar</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight mt-1">
            {org?.singkatan || "Aktif"}
          </p>
        </div>
      </div>

      {/* Pending List Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            Daftar Pengajuan Anggota Organisasi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tinjau keperluan kegiatan dan tandatangani secara digital untuk diteruskan ke WD3
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {!pendingRequests || pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">Tidak ada pengajuan tertunda</p>
              <p className="text-xs text-slate-400 mt-1">Semua surat organisasi telah Anda proses.</p>
            </div>
          ) : (
            pendingRequests.map((req: any) => (
              <div
                key={req.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-50 text-violet-700">
                      Organisasi
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {req.pemohon?.nama} ({req.pemohon?.nim || "-"})
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {req.ruangan?.nama} — {req.ruangan?.gedung?.nama} (Lt. {req.ruangan?.lantai})
                  </h3>

                  <p className="text-xs text-slate-500">
                    Kegiatan: <strong className="text-slate-700">{req.keperluan}</strong> • Waktu:{" "}
                    {new Date(req.tanggal_mulai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Link
                  href={`/dashboard/ketua-organisasi/tanda-tangan?id=${req.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-2xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Tanda Tangan Surat</span>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
