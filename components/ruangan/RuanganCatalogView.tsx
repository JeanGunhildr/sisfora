"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Building2,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Users,
  Maximize2,
  Calendar,
  Clock,
  Loader2,
  Info,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RuanganScheduleView from "@/components/ruangan/RuanganScheduleView";

interface Fasilitas {
  id: string;
  nama: string;
  satuan?: string;
}

interface Ruangan {
  id: string;
  nama: string;
  kode: string;
  kapasitas: number;
  luas: number;
  lantai: number;
  status_ketersediaan: "tersedia" | "ditahan" | "digunakan";
  deskripsi: string | null;
  foto_url: string | null;
  gedung: {
    id: string;
    nama: string;
    deskripsi?: string;
  } | null;
  ruangan_fasilitas: Array<{
    fasilitas: Fasilitas;
  }>;
}

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
  ditahan: {
    label: "Ditahan / Diajukan",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  digunakan: {
    label: "Sedang Digunakan",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

interface RuanganCatalogViewProps {
  role?: "mahasiswa" | "ketua_organisasi";
}

export default function RuanganCatalogView({ role = "mahasiswa" }: RuanganCatalogViewProps) {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [rawRooms, setRawRooms] = useState<any[]>([]);
  const [allPengajuan, setAllPengajuan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeSubmenu, setActiveSubmenu] = useState<"katalog" | "jadwal">(
    searchParams.get("tab") === "jadwal" ? "jadwal" : "katalog"
  );

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
      const [
        { data: roomData, error: roomError },
        { data: pengajuanData, error: pengajuanError },
        { data: authData },
      ] = await Promise.all([
        supabase
          .from("ruangan")
          .select(`
            id,
            kode,
            kapasitas,
            luas_m2,
            lantai,
            deskripsi,
            url_foto,
            gedung:gedung_id(id, nama, deskripsi),
            ruangan_fasilitas(
              fasilitas:fasilitas_id(id, nama, satuan)
            )
          `)
          .eq("status_aktif", true)
          .order("kode"),
        supabase
          .from("pengajuan")
          .select("id, ruangan_id, tanggal_mulai, tanggal_selesai, status")
          .in("status", ["menunggu_upload", "menunggu_ketua", "menunggu_wd3", "disetujui"]),
        supabase.auth.getUser(),
      ]);

      if (roomError) throw roomError;
      if (pengajuanError) throw pengajuanError;

      setRawRooms(roomData || []);
      setAllPengajuan(pengajuanData || []);

      if (authData?.user) {
        const { data: userActive } = await supabase
          .from("pengajuan")
          .select("id, status, nomor_pengajuan")
          .eq("pemohon_id", authData.user.id)
          .in("status", ["menunggu_upload", "menunggu_ketua", "menunggu_wd3"])
          .limit(1);

        if (userActive && userActive.length > 0) {
          setHasActiveSubmission(true);
          setActiveSubmissionNumber(userActive[0].nomor_pengajuan);
        }
      }
    } catch (e) {
      console.error("Gagal mengambil data ruangan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hitung status ketersediaan masing-masing ruangan secara dinamis berdasarkan filter tanggal & jam
  const processedRooms: Ruangan[] = useMemo(() => {
    const now = new Date();
    const nowIso = now.toISOString();

    let targetStartIso: string;
    let targetEndIso: string;

    if (filterTanggal) {
      const mulaiStr = filterWaktuMulai ? `${filterTanggal}T${filterWaktuMulai}:00` : `${filterTanggal}T00:00:00`;
      const selesaiStr = filterWaktuSelesai ? `${filterTanggal}T${filterWaktuSelesai}:00` : `${filterTanggal}T23:59:59`;
      targetStartIso = new Date(mulaiStr).toISOString();
      targetEndIso = new Date(selesaiStr).toISOString();
    } else {
      targetStartIso = nowIso;
      targetEndIso = nowIso;
    }

    return rawRooms.map((r: any) => {
      // Cek apakah ada pengajuan yang bertabrakan pada rentang waktu yang difilter
      const conflicts = allPengajuan.filter((p: any) => {
        if (p.ruangan_id !== r.id) return false;

        const pStart = new Date(p.tanggal_mulai).getTime();
        const pEnd = new Date(p.tanggal_selesai).getTime();
        const tStart = new Date(targetStartIso).getTime();
        const tEnd = new Date(targetEndIso).getTime();

        if (filterTanggal) {
          return pStart < tEnd && pEnd > tStart;
        } else {
          return pStart <= tStart && pEnd >= tStart;
        }
      });

      let status: "tersedia" | "ditahan" | "digunakan" = "tersedia";
      const hasApproved = conflicts.some((c: any) => c.status === "disetujui");
      const hasPending = conflicts.some((c: any) =>
        ["menunggu_upload", "menunggu_ketua", "menunggu_wd3"].includes(c.status)
      );

      if (hasApproved) {
        status = "digunakan";
      } else if (hasPending) {
        status = "ditahan";
      }

      return {
        id: r.id,
        nama: `Ruang ${r.kode}`,
        kode: r.kode,
        kapasitas: r.kapasitas,
        luas: Number(r.luas_m2) || 0,
        lantai: r.lantai,
        status_ketersediaan: status,
        deskripsi: r.deskripsi,
        foto_url: r.url_foto,
        gedung: Array.isArray(r.gedung) ? r.gedung[0] : r.gedung,
        ruangan_fasilitas: r.ruangan_fasilitas || [],
      };
    });
  }, [rawRooms, allPengajuan, filterTanggal, filterWaktuMulai, filterWaktuSelesai]);

  const gedungOptions = Array.from(
    new Set(processedRooms.map((r) => r.gedung?.nama).filter(Boolean))
  );
  const lantaiOptions = Array.from(new Set(processedRooms.map((r) => r.lantai))).sort();

  const filtered = processedRooms.filter((r) => {
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

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("semua");
    setFilterLantai("semua");
    setFilterGedung("semua");
    setFilterTanggal("");
    setFilterWaktuMulai("");
    setFilterWaktuSelesai("");
  };

  const getBookingUrl = (roomId: string) => {
    const params = new URLSearchParams();
    params.set("ruangan", roomId);
    if (filterTanggal) params.set("tanggal", filterTanggal);
    if (filterWaktuMulai) params.set("mulai", filterWaktuMulai);
    if (filterWaktuSelesai) params.set("selesai", filterWaktuSelesai);
    const basePath =
      role === "ketua_organisasi"
        ? "/dashboard/ketua-organisasi/peminjaman/baru"
        : "/dashboard/mahasiswa/peminjaman/baru";
    return `${basePath}?${params.toString()}`;
  };

  const statusPath =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/peminjaman"
      : "/dashboard/mahasiswa/peminjaman";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Ruangan Fakultas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cek ketersediaan jadwal, fasilitas ruangan, dan ajukan peminjaman secara transparan
          </p>
        </div>
        {/* Status Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
              <span className="font-medium">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submenu Navigation: Katalog vs Jadwal & Agenda Terpakai (Timeline) */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveSubmenu("katalog")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubmenu === "katalog"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Katalog &amp; Spesifikasi Ruangan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubmenu("jadwal")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubmenu === "jadwal"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Jadwal &amp; Agenda Terpakai (Timeline)</span>
        </button>
      </div>

      {activeSubmenu === "jadwal" ? (
        <RuanganScheduleView role={role} />
      ) : (
        <>
          {/* Security rule notice if student has an active reservation */}
          {hasActiveSubmission && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  Anda Sedang Memiliki 1 Pengajuan Peminjaman Aktif ({activeSubmissionNumber})
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Demi keamanan dan pencegahan pesanan ganda, setiap pengguna dibatasi 1 pengajuan peminjaman aktif. Tombol pengajuan akan kembali aktif setelah pengajuan sebelumnya selesai atau diputuskan.
                </p>
              </div>
              <Link
                href={statusPath}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 underline shrink-0 mt-0.5"
              >
                Pantau Status
              </Link>
            </div>
          )}

          {/* FILTER BOX KOMPREHENSIF */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Filter Waktu &amp; Jadwal Peminjaman
                  </span>
                </div>
                {(filterTanggal || filterWaktuMulai || filterWaktuSelesai) && (
                  <button
                    onClick={() => {
                      setFilterTanggal("");
                      setFilterWaktuMulai("");
                      setFilterWaktuSelesai("");
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Waktu
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Jam Mulai
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={filterWaktuMulai}
                      onChange={(e) => setFilterWaktuMulai(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Jam Selesai
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={filterWaktuSelesai}
                      onChange={(e) => setFilterWaktuSelesai(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode ruangan atau gedung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="semua">Semua Status</option>
                <option value="tersedia">Tersedia</option>
                <option value="ditahan">Ditahan / Diajukan</option>
                <option value="digunakan">Sedang Digunakan</option>
              </select>

              <select
                value={filterGedung}
                onChange={(e) => setFilterGedung(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="semua">Semua Gedung</option>
                {gedungOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <select
                value={filterLantai}
                onChange={(e) => setFilterLantai(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="semua">Semua Lantai</option>
                {lantaiOptions.map((l) => (
                  <option key={l} value={String(l)}>
                    Lantai {l}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded-xl transition-all ${
                    view === "grid" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Tampilan Grid"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded-xl transition-all ${
                    view === "list" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Tampilan List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {(search || filterStatus !== "semua" || filterGedung !== "semua" || filterLantai !== "semua") && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Result Count */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {loading ? "Memeriksa ketersediaan jadwal ruangan..." : `${filtered.length} ruangan sesuai kriteria`}
            </span>
          </div>

          {/* Rooms Grid / List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400">Memuat data ketersediaan ruangan...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-amber-100/80 p-12 text-center max-w-md mx-auto shadow-xs">
              <div className="relative w-24 h-24 mx-auto mb-3 drop-shadow-md">
                <Image src="/maskot1.png" alt="Merpi" width={96} height={96} className="object-contain" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Tidak Ada Ruangan Ditemukan</h3>
              <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                Merpi belum menemukan jadwal atau fasilitas yang sesuai. Coba sesuaikan tanggal, waktu, atau kata kunci pencarianmu ya!
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-5 py-2 rounded-full text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-2xs cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((room) => {
                const cfg = STATUS_CONFIG[room.status_ketersediaan] || STATUS_CONFIG.tersedia;
                const isAvail = room.status_ketersediaan === "tersedia";
                const canBook = isAvail && !hasActiveSubmission;

                return (
                  <div
                    key={room.id}
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                  >
                    <div className="h-44 bg-slate-100 relative overflow-hidden">
                      {room.foto_url ? (
                        <img
                          src={room.foto_url}
                          alt={room.nama}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-300">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}

                      <span
                        className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-xs flex items-center gap-1.5 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>

                      <span className="absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-xl bg-black/60 text-white backdrop-blur-md">
                        {room.kode}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            {room.gedung?.nama || "Gedung"}
                          </span>
                          <span className="text-xs text-slate-400">Lantai {room.lantai}</span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {room.nama}
                        </h3>

                        {room.deskripsi && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {room.deskripsi}
                          </p>
                        )}

                        {room.ruangan_fasilitas?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {room.ruangan_fasilitas.slice(0, 3).map((rf, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600"
                              >
                                {rf.fasilitas?.nama}
                              </span>
                            ))}
                            {room.ruangan_fasilitas.length > 3 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400">
                                +{room.ruangan_fasilitas.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {room.kapasitas} mhs
                          </span>
                          {room.luas > 0 && (
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                              {room.luas} m²
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRoom(room)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>

                          {canBook ? (
                            <Link
                              href={getBookingUrl(room.id)}
                              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
                            >
                              Pinjam
                            </Link>
                          ) : isAvail && hasActiveSubmission ? (
                            <span
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                              title="Anda memiliki 1 pengajuan aktif yang belum selesai"
                            >
                              Ada Pengajuan
                            </span>
                          ) : (
                            <span
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                              title={room.status_ketersediaan === "ditahan" ? "Sedang diajukan" : "Sedang digunakan"}
                            >
                              {room.status_ketersediaan === "ditahan" ? "Sedang Diajukan" : "Tidak Tersedia"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {filtered.map((room) => {
                  const cfg = STATUS_CONFIG[room.status_ketersediaan] || STATUS_CONFIG.tersedia;
                  const isAvail = room.status_ketersediaan === "tersedia";
                  const canBook = isAvail && !hasActiveSubmission;

                  return (
                    <div
                      key={room.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 overflow-hidden shrink-0 relative">
                          {room.foto_url ? (
                            <img src={room.foto_url} alt={room.nama} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-7 h-7 text-indigo-400 m-auto mt-3.5" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{room.nama}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {room.gedung?.nama} • Lantai {room.lantai} • Kapasitas {room.kapasitas} mhs
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedRoom(room)}
                          className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                        {canBook ? (
                          <Link
                            href={getBookingUrl(room.id)}
                            className="px-5 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
                          >
                            Ajukan Pinjam
                          </Link>
                        ) : isAvail && hasActiveSubmission ? (
                          <span
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                            title="Maksimal 1 pengajuan peminjaman aktif"
                          >
                            Ada Pengajuan
                          </span>
                        ) : (
                          <span className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                            {room.status_ketersediaan === "ditahan" ? "Sedang Diajukan" : "Tidak Tersedia"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-52 bg-slate-100 relative">
              {selectedRoom.foto_url ? (
                <img src={selectedRoom.foto_url} alt={selectedRoom.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-16 h-16" />
                </div>
              )}
              <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-3 left-4 text-xs font-bold px-3 py-1 rounded-xl bg-black/60 text-white backdrop-blur-md">
                {selectedRoom.kode}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {selectedRoom.gedung?.nama}
                  </span>
                  <span className="text-xs text-slate-400">Lantai {selectedRoom.lantai}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedRoom.nama}</h3>
                {selectedRoom.deskripsi && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedRoom.deskripsi}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Kapasitas</span>
                  <span className="font-bold text-slate-800">{selectedRoom.kapasitas} Mahasiswa</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Luas Ruangan</span>
                  <span className="font-bold text-slate-800">{selectedRoom.luas || "-"} m²</span>
                </div>
              </div>

              {selectedRoom.ruangan_fasilitas?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Fasilitas Tersedia</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.ruangan_fasilitas.map((rf, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700"
                      >
                        {rf.fasilitas?.nama}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                {!hasActiveSubmission && selectedRoom.status_ketersediaan === "tersedia" && (
                  <Link
                    href={getBookingUrl(selectedRoom.id)}
                    className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-center transition-colors shadow-sm"
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
