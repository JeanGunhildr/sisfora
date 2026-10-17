"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Users,
  Maximize2,
  Wifi,
  Tv,
  Wind,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Fasilitas {
  id: string;
  nama: string;
  ikon: string;
}

interface Ruangan {
  id: string;
  nama: string;
  kode: string;
  kapasitas: number;
  luas: number;
  lantai: number;
  status_ketersediaan: string;
  deskripsi: string | null;
  foto_url: string | null;
  gedung: {
    id: string;
    nama: string;
    kode: string;
  } | null;
  ruangan_fasilitas: Array<{
    fasilitas: Fasilitas;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  tersedia: {
    label: "Tersedia",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  ditahan: {
    label: "Ditahan",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  digunakan: {
    label: "Digunakan",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

const FASILITAS_ICON: Record<string, React.ElementType> = {
  proyektor: Tv,
  ac: Wind,
  wifi: Wifi,
  whiteboard: BookOpen,
};

export default function DaftarRuanganPage() {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Ruangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterLantai, setFilterLantai] = useState("semua");
  const [filterGedung, setFilterGedung] = useState("semua");
  const [selectedRoom, setSelectedRoom] = useState<Ruangan | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ruangan")
      .select(`
        id, nama, kode, kapasitas, luas, lantai, status_ketersediaan, deskripsi, foto_url,
        gedung(id, nama, kode),
        ruangan_fasilitas(fasilitas(id, nama, ikon))
      `)
      .eq("status_aktif", true)
      .order("nama");

    if (!error && data) setRooms(data as unknown as Ruangan[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const gedungOptions = Array.from(new Set(rooms.map((r) => r.gedung?.nama).filter(Boolean)));
  const lantaiOptions = Array.from(new Set(rooms.map((r) => r.lantai))).sort();

  const filtered = rooms.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.nama.toLowerCase().includes(q) ||
      r.kode.toLowerCase().includes(q) ||
      (r.gedung?.nama || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "semua" || r.status_ketersediaan === filterStatus;
    const matchLantai = filterLantai === "semua" || String(r.lantai) === filterLantai;
    const matchGedung = filterGedung === "semua" || r.gedung?.nama === filterGedung;
    return matchSearch && matchStatus && matchLantai && matchGedung;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Ruangan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Temukan dan ajukan peminjaman ruangan yang tersedia
          </p>
        </div>
        {/* Legend */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${val.dot}`} />
              {val.label}
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
            placeholder="Cari nama atau kode ruangan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="ditahan">Ditahan</option>
            <option value="digunakan">Digunakan</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Lantai Filter */}
        <div className="relative">
          <select
            value={filterLantai}
            onChange={(e) => setFilterLantai(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="semua">Semua Lantai</option>
            {lantaiOptions.map((l) => (
              <option key={l} value={String(l)}>
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
              className="appearance-none pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              view === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              view === "list" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-500 font-medium px-1">
        {loading ? "Memuat..." : `${filtered.length} ruangan ditemukan`}
      </p>

      {/* Room Grid / List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Tidak ada ruangan ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((room) => {
            const status = STATUS_CONFIG[room.status_ketersediaan] || STATUS_CONFIG.tersedia;
            const fasilitasList = room.ruangan_fasilitas?.map((rf) => rf.fasilitas).filter(Boolean) || [];

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all overflow-hidden flex flex-col"
              >
                {/* Photo / Placeholder */}
                <div className="h-36 bg-gradient-to-br from-blue-100 to-sky-50 flex items-center justify-center relative">
                  {room.foto_url ? (
                    <img src={room.foto_url} alt={room.nama} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-12 h-12 text-blue-200" />
                  )}
                  <div
                    className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.bg} ${status.color} ${status.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">{room.nama}</h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{room.kode}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <Info size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {room.kapasitas} orang
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 size={11} />
                      {room.luas} m²
                    </span>
                    <span>Lantai {room.lantai}</span>
                  </div>

                  {room.gedung && (
                    <p className="text-[10px] text-slate-400 mb-3">{room.gedung.nama}</p>
                  )}

                  {/* Fasilitas */}
                  {fasilitasList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {fasilitasList.slice(0, 3).map((f) => (
                        <span
                          key={f.id}
                          className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full"
                        >
                          {f.nama}
                        </span>
                      ))}
                      {fasilitasList.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full">
                          +{fasilitasList.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-auto">
                    {room.status_ketersediaan === "tersedia" ? (
                      <Link
                        href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                        className="block w-full py-2 text-center rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Ajukan Peminjaman
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="block w-full py-2 text-center rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                      >
                        {room.status_ketersediaan === "ditahan" ? "Sedang Diproses" : "Tidak Tersedia"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5 text-left">Ruangan</th>
                <th className="py-3 px-4 text-left">Gedung</th>
                <th className="py-3 px-4 text-left">Lantai</th>
                <th className="py-3 px-4 text-left">Kapasitas</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((room) => {
                const status = STATUS_CONFIG[room.status_ketersediaan] || STATUS_CONFIG.tersedia;
                return (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-800">{room.nama}</p>
                      <p className="text-slate-400 font-mono text-[10px]">{room.kode}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{room.gedung?.nama || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-600">Lantai {room.lantai}</td>
                    <td className="py-3.5 px-4 text-slate-600">{room.kapasitas} orang</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.bg} ${status.color} ${status.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {room.status_ketersediaan === "tersedia" ? (
                        <Link
                          href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Ajukan
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400">
                          Tidak Tersedia
                        </span>
                      )}
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
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="h-40 bg-gradient-to-br from-blue-100 to-sky-50 relative flex items-center justify-center">
              {selectedRoom.foto_url ? (
                <img
                  src={selectedRoom.foto_url}
                  alt={selectedRoom.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-16 h-16 text-blue-200" />
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
                    <h2 className="text-lg font-bold text-slate-900">{selectedRoom.nama}</h2>
                    <p className="text-xs font-mono text-slate-400">{selectedRoom.kode}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      STATUS_CONFIG[selectedRoom.status_ketersediaan]?.bg
                    } ${STATUS_CONFIG[selectedRoom.status_ketersediaan]?.color} ${
                      STATUS_CONFIG[selectedRoom.status_ketersediaan]?.border
                    }`}
                  >
                    {STATUS_CONFIG[selectedRoom.status_ketersediaan]?.label}
                  </span>
                </div>

                {selectedRoom.deskripsi && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedRoom.deskripsi}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xl font-extrabold text-slate-800">{selectedRoom.kapasitas}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kapasitas</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xl font-extrabold text-slate-800">{selectedRoom.luas}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Luas (m²)</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xl font-extrabold text-slate-800">{selectedRoom.lantai}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lantai</p>
                </div>
              </div>

              {selectedRoom.gedung && (
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Gedung:</span>{" "}
                  {selectedRoom.gedung.nama} ({selectedRoom.gedung.kode})
                </p>
              )}

              {/* Fasilitas */}
              {selectedRoom.ruangan_fasilitas.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Fasilitas:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.ruangan_fasilitas.map((rf) => (
                      <span
                        key={rf.fasilitas.id}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-full border border-blue-100"
                      >
                        {rf.fasilitas.nama}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                {selectedRoom.status_ketersediaan === "tersedia" && (
                  <Link
                    href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${selectedRoom.id}`}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 text-center transition-colors"
                  >
                    Ajukan Peminjaman
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
