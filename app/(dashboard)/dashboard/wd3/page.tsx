import React from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Link from "next/link";
import { FileCheck2, Clock, CheckCircle2, XCircle, ArrowRight, Building2, User } from "lucide-react";

export default async function WD3Dashboard() {
  const { user, profile } = await requireRole(["wd3"]);
  const supabase = await createClient();

  // Fetch pending applications waiting for WD3 signature
  const { data: pendingRequests } = await supabase
    .from("peminjaman")
    .select(`
      id, status, kategori, tanggal_mulai, tanggal_selesai, waktu_mulai, waktu_selesai,
      keperluan, created_at,
      pemohon:users!pemohon_id(nama, nim, email),
      ruangan(nama, kode, lantai, gedung(nama))
    `)
    .eq("status", "menunggu_wd3")
    .order("created_at", { ascending: false });

  // Fetch approved applications count
  const { count: approvedCount } = await supabase
    .from("peminjaman")
    .select("id", { count: "exact", head: true })
    .in("status", ["disetujui_wd3", "berlangsung", "selesai"]);

  const totalPending = pendingRequests?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <DashboardHeader nama={profile.nama} roleTitle="Wakil Dekan 3 (Bidang Kemahasiswaan)" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 p-8 sm:p-10 text-white shadow-xl shadow-blue-500/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Persetujuan & Tanda Tangan Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Persetujuan Peminjaman Ruangan
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            Tinjau permohonan penggunaan sarana dan prasarana fakultas, lakukan verifikasi dokumen, dan bubuhkan tanda tangan digital secara sah.
          </p>
        </div>
      </div>

      {/* 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Menunggu Tanda Tangan Anda</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-1">
            {totalPending} Permohonan
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Total Permohonan Disetujui</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight mt-1">
            {approvedCount ?? 0} Permohonan
          </p>
        </div>
      </div>

      {/* Pending List Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Daftar Permohonan Menunggu Persetujuan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik permohonan untuk meninjau surat dan membubuhkan tanda tangan
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {!pendingRequests || pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">Tidak ada permohonan tertunda</p>
              <p className="text-xs text-slate-400 mt-1">Semua surat peminjaman telah Anda tinjau.</p>
            </div>
          ) : (
            pendingRequests.map((req: any) => (
              <div
                key={req.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      {req.kategori === "organisasi" ? "Organisasi" : "Umum"}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {req.pemohon?.nama} ({req.pemohon?.nim || "-"})
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {req.ruangan?.nama} — {req.ruangan?.gedung?.nama} (Lt. {req.ruangan?.lantai})
                  </h3>

                  <p className="text-xs text-slate-500">
                    Acara: <strong className="text-slate-700">{req.keperluan || "Kegiatan Mahasiswa"}</strong> • Tanggal:{" "}
                    {new Date(req.tanggal_mulai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Link
                  href={`/dashboard/wd3/tanda-tangan?id=${req.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-2xs"
                >
                  <span>Tinjau & Tanda Tangan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
