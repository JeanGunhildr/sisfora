"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Users,
  Maximize2,
  Tv,
  Wind,
  Wifi,
  BookOpen,
  Loader2,
  Info,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Fasilitas {
  id: string;
  nama: string;
  satuan?: string | null;
}

interface Ruangan {
  id: string;
  kode: string;
  kapasitas: number;
  luas_m2: number | null;
  lantai: number | null;
  deskripsi: string | null;
  url_foto: string | null;
  status_aktif: boolean;
  status_ketersediaan: "tersedia" | "diproses" | "digunakan";
  gedung: {
    id: string;
    nama: string;
  } | null;
  ruangan_fasilitas: Array<{
    fasilitas: Fasilitas;
  }>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  tersedia: {
    label: "Tersedia",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  diproses: {
    label: "Sedang Diproses",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  digunakan: {
    label: "Sedang Digunakan",
    label: "Sedang Digunakan",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export default function DaftarRuanganPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [rawRooms, setRawRooms] = useState<any[]>([]);
  const [allPengajuan, setAllPengajuan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterLantai, setFilterLantai] = useState("semua");
  const [filterGedung, setFilterGedung] = useState("semua");

  // Filter Tanggal & Waktu (Sesuai tugas)
  const [filterTanggal, setFilterTanggal] = useState(searchParams.get("tanggal") || "");
  const [filterWaktuMulai, setFilterWaktuMulai] = useState(searchParams.get("mulai") || "");
  const [filterWaktuSelesai, setFilterWaktuSelesai] = useState(searchParams.get("selesai") || "");

  const [selectedRoom, setSelectedRoom] = useState<Ruangan | null>(null);
  const [hasActiveSubmission, setHasActiveSubmission] = useState(false);
  const [activeSubmissionNumber, setActiveSubmissionNumber] = useState<string | null>(null);

  // Load rooms and active pengajuan
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ruangan")
        .select(`
          id, kode, kapasitas, luas_m2, lantai, deskripsi, url_foto, status_aktif,
          gedung:gedung!ruangan_gedung_id_fkey (id, nama),
          ruangan_fasilitas:ruangan_fasilitas (
            fasilitas:fasilitas (id, nama, satuan)
          )
        `)
        .eq("status_aktif", true)
        .order("kode", { ascending: true });

      if (error) throw error;

      // Ambil pengajuan aktif yang berlangsung saat ini
      const nowIso = new Date().toISOString();
      const { data: activeLoans } = await supabase
        .from("pengajuan")
        .select("ruangan_id, status, tanggal_mulai, tanggal_selesai")
        .not("status", "in", '("ditolak_ketua","ditolak_wd3","dibatalkan","kedaluwarsa")')
        .lte("tanggal_mulai", nowIso)
        .gte("tanggal_selesai", nowIso);

      const loansByRoom = new Map<string, "diproses" | "digunakan">();
      activeLoans?.forEach((l) => {
        if (l.status === "disetujui") {
          loansByRoom.set(l.ruangan_id, "digunakan");
        } else if (!loansByRoom.has(l.ruangan_id)) {
          loansByRoom.set(l.ruangan_id, "diproses");
        }
      });

      const processedRooms: Ruangan[] = (data || []).map((r: any) => ({
        ...r,
        status_ketersediaan: loansByRoom.get(r.id) || "tersedia",
      }));

      setRooms(processedRooms);
    } catch (err) {
      console.error("Gagal memuat data ruangan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gedungOptions = Array.from(new Set(rooms.map((r) => r.gedung?.nama).filter(Boolean)));
  const lantaiOptions = Array.from(new Set(rooms.map((r) => r.lantai).filter(Boolean))).sort(
    (a, b) => (Number(a) || 0) - (Number(b) || 0)
  );

  const filtered = processedRooms.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.kode.toLowerCase().includes(q) ||
      (r.deskripsi || "").toLowerCase().includes(q) ||
      (r.gedung?.nama || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "semua" || r.status_ketersediaan === filterStatus;
    const matchLantai = filterLantai === "semua" || String(r.lantai) === filterLantai;
    const matchGedung = filterGedung === "semua" || r.gedung?.nama === filterGedung;
    return matchSearch && matchStatus && matchLantai && matchGedung;
  });

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("semua");
    setFilterLantai("semua");
    setFilterGedung("semua");
    setFilterTanggal("");
    setFilterWaktuMulai("");
    setFilterWaktuSelesai("");
  };

  // Helper untuk membuat link pengajuan dengan query params terisi otomatis jika ada filter
  const getBookingUrl = (roomId: string) => {
    const params = new URLSearchParams();
    params.set("ruangan", roomId);
    if (filterTanggal) params.set("tanggal", filterTanggal);
    if (filterWaktuMulai) params.set("mulai", filterWaktuMulai);
    if (filterWaktuSelesai) params.set("selesai", filterWaktuSelesai);
    return `/dashboard/mahasiswa/peminjaman/baru?${params.toString()}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Ruangan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sistem First Come, First Served — jadwalkan dan amankan ruangan pilihan Anda.
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500 bg-white p-2.5 px-4 rounded-2xl border border-slate-100 shadow-2xs">
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${val.dot}`} />
              <span className="font-medium">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode ruangan, gedung, atau fasilitas..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="diproses">Sedang Diproses</option>
            <option value="digunakan">Sedang Digunakan</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Lantai Filter */}
        <div className="relative">
          <select
            value={filterLantai}
            onChange={(e) => setFilterLantai(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="semua">Semua Lantai</option>
            {lantaiOptions.map((l) => (
              <option key={String(l)} value={String(l)}>
                Lantai {l}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Gedung Filter */}
        {gedungOptions.length > 0 && (
          <div className="relative">
            <select
              value={filterGedung}
              onChange={(e) => setFilterGedung(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="semua">Semua Gedung</option>
              {gedungOptions.map((g) => (
                <option key={g} value={g!}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* View Toggle */}
        <div className="ml-auto flex items-center gap-1 p-1 bg-slate-100 rounded-full">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              view === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              view === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Results count & FCFS notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 font-medium px-1 gap-2">
        <span>{loading ? "Memuat ruangan..." : `${filtered.length} ruangan aktif tersedia`}</span>
        <span className="text-indigo-600 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          Mekanisme First Come, First Served: siapa cepat submit, jadwal langsung terkunci.
        </span>
      </div>

      {/* Room Grid / List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Tidak ada ruangan yang sesuai filter</p>
          <p className="text-xs text-slate-400 mt-1">Coba ubah tanggal, jam kegiatan, atau kriteria pencarian Anda.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((room) => {
            const status = STATUS_CONFIG[room.status_ketersediaan] || STATUS_CONFIG.tersedia;
            const fasilitasList = room.ruangan_fasilitas?.map((rf: any) => rf.fasilitas?.nama).filter(Boolean) || [];

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden flex flex-col group"
              >
                {/* Photo / Placeholder */}
                <div className="h-44 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
                  {room.url_foto ? (
                    <img
                      src={room.url_foto}
                      alt={room.kode}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-indigo-300" />
                  )}
                  <div
                    className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.bg} ${status.color} ${status.border} shadow-2xs backdrop-blur-xs`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </div>
                  <span className="absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-xl bg-black/60 text-white backdrop-blur-md">
                    {room.kode}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-tight">
                        Ruang {room.kode}
                      </h3>
                      {room.gedung && (
                        <p className="text-xs text-slate-400 mt-0.5">{room.gedung.nama}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      title="Lihat Detail Fasilitas"
                    >
                      <Info size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 my-2">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <Users size={12} className="text-slate-400" />
                      {room.kapasitas} orang
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 size={12} className="text-slate-400" />
                      {room.luas_m2 || "-"} m²
                    </span>
                    <span>Lt. {room.lantai || 1}</span>
                  </div>

                  {room.deskripsi && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">
                      {room.deskripsi}
                    </p>
                  )}

                  {/* Fasilitas */}
                  {fasilitasList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4 mt-auto pt-2">
                      {fasilitasList.slice(0, 3).map((f) => (
                        <span
                          key={f.id}
                          className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-medium rounded-md"
                        >
                          {fName}
                        </span>
                      ))}
                      {fasilitasList.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-md">
                          +{fasilitasList.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <Link
                      href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                      className="block w-full py-2.5 text-center rounded-2xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98 transition-all shadow-xs"
                    >
                      Ajukan Peminjaman
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5 text-left">Kode Ruangan</th>
                <th className="py-3.5 px-4 text-left">Gedung</th>
                <th className="py-3.5 px-4 text-left">Lantai</th>
                <th className="py-3.5 px-4 text-left">Kapasitas</th>
                <th className="py-3.5 px-4 text-left">Status Saat Ini</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((room) => {
                const status = STATUS_CONFIG[room.status_ketersediaan] || STATUS_CONFIG.tersedia;
                return (
                  <tr key={room.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-800">Ruang {room.kode}</p>
                      <p className="text-slate-400 text-[10px] truncate max-w-xs">{room.deskripsi || "-"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{room.gedung?.nama || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-600">Lantai {room.lantai || 1}</td>
                    <td className="py-3.5 px-4 text-slate-600">{room.kapasitas} orang</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.color} ${status.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                        className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        Ajukan
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Image */}
            <div className="h-44 bg-gradient-to-br from-indigo-100 to-blue-50 relative flex items-center justify-center">
              {selectedRoom.url_foto ? (
                <img
                  src={selectedRoom.url_foto}
                  alt={selectedRoom.kode}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-16 h-16 text-indigo-300" />
                <Building2 className="w-16 h-16 text-indigo-300" />
              )}
              <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Ruang {selectedRoom.kode}
                    </h2>
                    {selectedRoom.gedung && (
                      <p className="text-xs text-slate-500 mt-0.5">{selectedRoom.gedung.nama}</p>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      STATUS_CONFIG[selectedRoom.status_ketersediaan]?.bg
                    } ${STATUS_CONFIG[selectedRoom.status_ketersediaan]?.color} ${
                      STATUS_CONFIG[selectedRoom.status_ketersediaan]?.border
                    }`}
                  >
                    {STATUS_CONFIG[selectedRoom.status_ketersediaan]?.label}
                  </span>
                </div>

                {selectedRoom.deskripsi && (
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{selectedRoom.deskripsi}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xl font-extrabold text-slate-800">{selectedRoom.kapasitas}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kapasitas (Orang)</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xl font-extrabold text-slate-800">{selectedRoom.luas_m2 || "-"}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Luas (m²)</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xl font-extrabold text-slate-800">{selectedRoom.lantai || 1}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lantai</p>
                </div>
              </div>

              {/* Fasilitas */}
              {selectedRoom.ruangan_fasilitas?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Daftar Fasilitas:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.ruangan_fasilitas.map((rf: any, idx: number) => (
                      <span
                        key={rf.fasilitas.id}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-medium rounded-full border border-indigo-100"
                      >
                        {rf.fasilitas.nama} {rf.fasilitas.satuan ? `(${rf.fasilitas.satuan})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* FCFS note */}
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
                ⚡ <strong>Aturan Peminjaman:</strong> SISFORA menerapkan sistem <em>First Come, First Served</em>. Jadwal ruangan dapat diajukan kapan saja dan akan langsung diamankan setelah pengajuan terkirim.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${selectedRoom.id}`}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 text-center transition-colors shadow-xs"
                >
                  Ajukan Peminjaman
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
