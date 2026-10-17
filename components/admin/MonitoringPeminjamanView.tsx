"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  Users,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  RotateCw,
  ExternalLink,
  ChevronRight,
  GitFork,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomSelect from "@/components/ui/CustomSelect";

export interface PengajuanItem {
  id: string;
  nomor_pengajuan: string;
  pemohon_id: string;
  ruangan_id: string;
  jenis_peminjaman: string;
  organisasi_id?: string | null;
  nama_kegiatan: string;
  deskripsi_kegiatan?: string | null;
  jumlah_peserta: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  alasan_penolakan?: string | null;
  created_at: string;
  pemohon?: {
    nama: string;
    nim?: string | null;
    email: string;
  };
  ruangan?: {
    kode: string;
    kapasitas: number;
    gedung?: {
      nama: string;
    };
  };
  organisasi?: {
    nama: string;
    singkatan?: string | null;
  };
  dokumen_pengajuan?: Array<{
    id: string;
    url_file: string;
    nama_file: string;
    status_dokumen: string;
  }>;
}

export default function MonitoringPeminjamanView() {
  const supabase = createClient();

  const [pengajuans, setPengajuans] = useState<PengajuanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState<"semua" | "umum" | "organisasi">("semua");
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  // Modal Detail
  const [detailModalItem, setDetailModalItem] = useState<PengajuanItem | null>(null);

  const fetchPengajuan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pengajuan")
        .select(`
          *,
          pemohon:users!pengajuan_pemohon_id_fkey (nama, nim, email),
          ruangan:ruangan!pengajuan_ruangan_id_fkey (
            kode,
            kapasitas,
            gedung:gedung!ruangan_gedung_id_fkey (nama)
          ),
          organisasi:organisasi!pengajuan_organisasi_id_fkey (nama, singkatan),
          dokumen_pengajuan:dokumen_pengajuan!dokumen_pengajuan_pengajuan_id_fkey (id, url_file, nama_file, status_dokumen)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPengajuans((data as any) || []);
    } 
    catch (err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    const error = err as {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    };

    console.error("Gagal mengambil data pengajuan:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  } else {
    console.error("Gagal mengambil data pengajuan:", err);
  }
} finally {
  setLoading(false);
}
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  // Filtered Pengajuan
  const filteredData = pengajuans.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.nomor_pengajuan.toLowerCase().includes(q) ||
      p.nama_kegiatan.toLowerCase().includes(q) ||
      (p.pemohon?.nama && p.pemohon.nama.toLowerCase().includes(q)) ||
      (p.pemohon?.nim && p.pemohon.nim.toLowerCase().includes(q)) ||
      (p.ruangan?.kode && p.ruangan.kode.toLowerCase().includes(q));

    const matchJenis = filterJenis === "semua" || p.jenis_peminjaman.toLowerCase() === filterJenis;

    const matchStatus =
      filterStatus === "semua" ||
      (filterStatus === "menunggu" && p.status.toLowerCase().includes("menunggu")) ||
      (filterStatus === "disetujui" && p.status.toLowerCase().includes("disetujui")) ||
      (filterStatus === "ditolak" && p.status.toLowerCase().includes("ditolak"));

    return matchSearch && matchJenis && matchStatus;
  });

  const countTotal = pengajuans.length;
  const countUmum = pengajuans.filter((p) => p.jenis_peminjaman === "umum").length;
  const countOrg = pengajuans.filter((p) => p.jenis_peminjaman === "organisasi").length;
  const countApproved = pengajuans.filter((p) => p.status.toLowerCase().includes("disetujui")).length;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("disetujui")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Disetujui</span>
        </span>
      );
    }
    if (s.includes("ditolak")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Ditolak</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Pengajuan
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
            {countTotal}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Semua data peminjaman</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Kategori Umum
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
            {countUmum}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Alur Mahasiswa &rarr; WD3</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Kategori Organisasi
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">
            {countOrg}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Alur Mahasiswa &rarr; Ketua &rarr; WD3</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Telah Disetujui
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
            {countApproved}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Siap menggunakan ruangan</div>
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan, nomor, atau nama..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter Kategori */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setFilterJenis("semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterJenis === "semua" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              Semua Kategori
            </button>
            <button
              onClick={() => setFilterJenis("umum")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterJenis === "umum" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              Umum
            </button>
            <button
              onClick={() => setFilterJenis("organisasi")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterJenis === "organisasi" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              Organisasi
            </button>
          </div>

          {/* Filter Status with CustomSelect */}
          <div className="w-full sm:w-44">
            <CustomSelect
              options={[
                { value: "semua", label: "Semua Status" },
                { value: "menunggu", label: "Menunggu" },
                { value: "disetujui", label: "Disetujui" },
                { value: "ditolak", label: "Ditolak" },
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              placeholder="Pilih Status"
            />
          </div>
        </div>

        <button
          onClick={fetchPengajuan}
          disabled={loading}
          className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-end md:self-auto"
          title="Refresh Data"
        >
          <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table of Loan Applications */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Monitoring Data Peminjaman Ruangan
              </h2>
              <p className="text-xs text-slate-500">
                Data histori dan alur persetujuan surat permohonan peminjaman ruangan
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {filteredData.length} Data
          </span>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchQuery || filterJenis !== "semua" || filterStatus !== "semua"
              ? "Tidak ada data pengajuan yang sesuai dengan filter pencarian."
              : "Belum ada data pengajuan peminjaman di database."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Pengajuan & Kegiatan</th>
                  <th className="py-3.5 px-6">Pemohon</th>
                  <th className="py-3.5 px-6">Ruangan / Gedung</th>
                  <th className="py-3.5 px-6">Waktu Peminjaman</th>
                  <th className="py-3.5 px-6 text-center">Kategori</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-mono text-[11px] text-indigo-600 font-bold">
                        {p.nomor_pengajuan}
                      </div>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 truncate">
                        {p.nama_kegiatan}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {p.jumlah_peserta} Peserta
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{p.pemohon?.nama || "Mahasiswa"}</div>
                      <div className="text-slate-400 text-[11px]">{p.pemohon?.nim || "-"}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-800">{p.ruangan?.kode || "-"}</div>
                      <div className="text-slate-400 text-[11px]">{p.ruangan?.gedung?.nama || "Gedung"}</div>
                    </td>

                    <td className="py-4 px-6 text-slate-600 leading-relaxed">
                      <div>
                        {new Date(p.tanggal_mulai).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(p.tanggal_mulai).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(p.tanggal_selesai).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.jenis_peminjaman === "organisasi"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {p.jenis_peminjaman}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(p.status)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDetailModalItem(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: DETAIL PENGAJUAN PEMINJAMAN
          ======================================================== */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Detail Peminjaman Ruangan
                  </h4>
                  <span className="font-mono text-xs text-indigo-600 font-semibold">
                    {detailModalItem.nomor_pengajuan}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Header Box: Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Status Peminjaman</span>
                  <div className="mt-1">{getStatusBadge(detailModalItem.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium">Kategori</span>
                  <div className="font-bold text-slate-800 uppercase text-xs mt-1">
                    {detailModalItem.jenis_peminjaman}
                  </div>
                </div>
              </div>

              {/* Data Kegiatan */}
              <div>
                <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Informasi Kegiatan
                </h5>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Acara / Kegiatan:</span>
                    <span className="font-bold text-slate-800 text-right">{detailModalItem.nama_kegiatan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deskripsi:</span>
                    <span className="text-slate-700 text-right max-w-xs">{detailModalItem.deskripsi_kegiatan || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimasi Jumlah Peserta:</span>
                    <span className="font-semibold text-slate-800">{detailModalItem.jumlah_peserta} Orang</span>
                  </div>
                </div>
              </div>

              {/* Ruangan & Jadwal */}
              <div>
                <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Ruangan & Jadwal
                </h5>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ruangan:</span>
                    <span className="font-bold text-indigo-600">
                      {detailModalItem.ruangan?.kode} ({detailModalItem.ruangan?.gedung?.nama || "Gedung"})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Mulai:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(detailModalItem.tanggal_mulai).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Selesai:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(detailModalItem.tanggal_selesai).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Pemohon */}
              <div>
                <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Data Mahasiswa Pemohon
                </h5>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pemohon:</span>
                    <span className="font-bold text-slate-800">{detailModalItem.pemohon?.nama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIM:</span>
                    <span className="font-semibold text-slate-800">{detailModalItem.pemohon?.nim || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-700">{detailModalItem.pemohon?.email}</span>
                  </div>
                </div>
              </div>

              {/* Dokumen Surat Peminjaman */}
              {detailModalItem.dokumen_pengajuan && detailModalItem.dokumen_pengajuan.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                    Dokumen Berkas Terlampir
                  </h5>
                  <div className="space-y-2">
                    {detailModalItem.dokumen_pengajuan.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <div>
                            <div className="font-bold text-indigo-900">{doc.nama_file}</div>
                            <div className="text-[10px] text-indigo-600">Status: {doc.status_dokumen}</div>
                          </div>
                        </div>
                        <a
                          href={doc.url_file}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Surat</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alasan Penolakan if rejected */}
              {detailModalItem.alasan_penolakan && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
                  <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Catatan / Alasan Penolakan:</span>
                  </div>
                  <p className="text-xs">{detailModalItem.alasan_penolakan}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
