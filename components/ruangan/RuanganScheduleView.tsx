"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Users,
  Search,
  Filter,
  Info,
  Sparkles,
  BookOpen,
  FileCheck2,
  X,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import Link from "next/link";

interface RuanganItem {
  id: string;
  kode: string;
  kapasitas: number;
  lantai: number | null;
  gedungNama: string;
}

interface ScheduleEvent {
  id: string;
  ruanganId: string;
  title: string;
  subtitle?: string;
  type: "kuliah" | "peminjaman_disetujui" | "peminjaman_proses";
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  penanggungJawab?: string;
  keterangan?: string;
  sksOrPeserta?: string;
}

const HARI_MAP: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

const START_HOUR = 7; // 07:00
const END_HOUR = 21; // 21:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 14 hours

// Fallback sample courses if table mata_kuliah hasn't been migrated yet
const FALLBACK_COURSES = [
  { kode_mk: "IF2101", nama_mk: "Pemrograman Web Lanjut", dosen: "Dr. Ir. Budi Santoso", kelas: "IF-3A", hari: "Senin", jam_mulai: "08:00", jam_selesai: "10:30" },
  { kode_mk: "IF2105", nama_mk: "Basis Data Terdistribusi", dosen: "Prof. Siti Rahma", kelas: "IF-3B", hari: "Senin", jam_mulai: "13:00", jam_selesai: "15:30" },
  { kode_mk: "IF3201", nama_mk: "Kecerdasan Buatan", dosen: "Ahmad Fauzi, M.T.", kelas: "IF-5A", hari: "Selasa", jam_mulai: "09:00", jam_selesai: "11:30" },
  { kode_mk: "IF1102", nama_mk: "Struktur Data & Algoritma", dosen: "Dr. Hendra Wijaya", kelas: "IF-1A", hari: "Rabu", jam_mulai: "08:00", jam_selesai: "11:00" },
  { kode_mk: "IF2204", nama_mk: "Jaringan Komputer", dosen: "Doni Pratama, M.Kom.", kelas: "IF-3A", hari: "Kamis", jam_mulai: "10:00", jam_selesai: "12:30" },
  { kode_mk: "IF4102", nama_mk: "Keamanan Siber", dosen: "Dr. Ir. Budi Santoso", kelas: "IF-7A", hari: "Jumat", jam_mulai: "08:30", jam_selesai: "11:00" },
  { kode_mk: "SI1201", nama_mk: "Analisis & Perancangan Sistem", dosen: "Dewi Lestari, M.M.S.I.", kelas: "SI-2A", hari: "Senin", jam_mulai: "09:00", jam_selesai: "11:30" },
  { kode_mk: "SI2203", nama_mk: "Manajemen Proyek TI", dosen: "Rudi Hartono, M.T.", kelas: "SI-4A", hari: "Selasa", jam_mulai: "13:00", jam_selesai: "15:30" },
  { kode_mk: "TI1101", nama_mk: "Kalkulus Informatika II", dosen: "Drs. Supriyanto, M.Si.", kelas: "TI-2B", hari: "Kamis", jam_mulai: "08:00", jam_selesai: "10:00" },
];

interface RuanganScheduleViewProps {
  role?: "mahasiswa" | "ketua_organisasi" | "admin" | "wd3";
}

export default function RuanganScheduleView({ role = "mahasiswa" }: RuanganScheduleViewProps) {
  const supabase = createClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGedung, setSelectedGedung] = useState<string>("all");

  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([]);
  const [gedungList, setGedungList] = useState<string[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Detail State
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Time slots for header (07:00 to 21:00)
  const timeHeaders = useMemo(() => {
    const list: string[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      list.push(`${String(h).padStart(2, "0")}:00`);
    }
    return list;
  }, []);

  // Fetch Rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data: rawRooms } = await supabase
          .from("ruangan")
          .select("id, kode, kapasitas, lantai, gedung:gedung_id(nama)")
          .eq("status_aktif", true)
          .order("kode", { ascending: true });

        if (rawRooms) {
          const formatted: RuanganItem[] = rawRooms.map((r: any) => ({
            id: r.id,
            kode: r.kode,
            kapasitas: r.kapasitas,
            lantai: r.lantai,
            gedungNama: r.gedung?.nama || "Fakultas",
          }));
          setRuanganList(formatted);

          const uniqueGedung = Array.from(new Set(formatted.map((r) => r.gedungNama)));
          setGedungList(uniqueGedung);
        }
      } catch (e) {
        console.error("Gagal memuat ruangan:", e);
      }
    }
    fetchRooms();
  }, []);

  // Fetch Events (Pengajuan + Mata Kuliah) for selectedDate
  useEffect(() => {
    async function fetchSchedule() {
      if (ruanganList.length === 0) return;
      setLoading(true);

      const dayIndex = selectedDate.getDay();
      const hariName = HARI_MAP[dayIndex] || "Senin";

      // Date string formatted as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split("T")[0];
      const startOfDay = `${dateStr}T00:00:00.000Z`;
      const endOfDay = `${dateStr}T23:59:59.999Z`;

      const collectedEvents: ScheduleEvent[] = [];

      try {
        // 1. Fetch Peminjaman dari public.pengajuan yang aktif/disetujui
        const { data: loans } = await supabase
          .from("pengajuan")
          .select(`
            id,
            nomor_pengajuan,
            nama_kegiatan,
            deskripsi_kegiatan,
            jenis_peminjaman,
            jumlah_peserta,
            status,
            tanggal_mulai,
            tanggal_selesai,
            ruangan_id,
            pemohon:users!pengajuan_pemohon_id_fkey(nama),
            organisasi:organisasi!pengajuan_organisasi_id_fkey(nama, singkatan)
          `)
          .in("status", ["disetujui", "menunggu_wd3", "menunggu_ketua"])
          .lte("tanggal_mulai", endOfDay)
          .gte("tanggal_selesai", startOfDay);

        if (loans) {
          loans.forEach((l: any) => {
            const startD = new Date(l.tanggal_mulai);
            const endD = new Date(l.tanggal_selesai);

            const startH = String(startD.getHours()).padStart(2, "0");
            const startM = String(startD.getMinutes()).padStart(2, "0");
            const endH = String(endD.getHours()).padStart(2, "0");
            const endM = String(endD.getMinutes()).padStart(2, "0");

            const isApproved = l.status === "disetujui";
            const orgName = l.organisasi?.singkatan || l.organisasi?.nama;

            collectedEvents.push({
              id: l.id,
              ruanganId: l.ruangan_id,
              title: l.nama_kegiatan,
              subtitle: orgName ? `Ormawa: ${orgName}` : "Peminjaman Umum",
              type: isApproved ? "peminjaman_disetujui" : "peminjaman_proses",
              startTime: `${startH}:${startM}`,
              endTime: `${endH}:${endM}`,
              penanggungJawab: l.pemohon?.nama || "Mahasiswa",
              keterangan: l.deskripsi_kegiatan || "Peminjaman ruangan untuk kegiatan akademik/organisasi.",
              sksOrPeserta: `${l.jumlah_peserta || 1} Peserta`,
            });
          });
        }

        // 2. Fetch Jadwal Kuliah dari public.mata_kuliah
        try {
          const { data: courses, error: courseError } = await supabase
            .from("mata_kuliah")
            .select("*")
            .eq("status_aktif", true)
            .eq("hari", hariName);

          if (!courseError && courses && courses.length > 0) {
            courses.forEach((c: any) => {
              collectedEvents.push({
                id: c.id,
                ruanganId: c.ruangan_id,
                title: `${c.nama_mk} (${c.kelas})`,
                subtitle: `Kode: ${c.kode_mk}`,
                type: "kuliah",
                startTime: c.jam_mulai.slice(0, 5),
                endTime: c.jam_selesai.slice(0, 5),
                penanggungJawab: c.dosen,
                keterangan: `Mata kuliah reguler semester aktif, ${c.sks} SKS.`,
                sksOrPeserta: `${c.sks} SKS`,
              });
            });
          } else {
            // Gunakan fallback courses jika table belum dibuat / kosong
            FALLBACK_COURSES.filter((f) => f.hari === hariName).forEach((c, idx) => {
              const targetRoom = ruanganList[idx % ruanganList.length];
              if (targetRoom) {
                collectedEvents.push({
                  id: `mock-${idx}`,
                  ruanganId: targetRoom.id,
                  title: `${c.nama_mk} (${c.kelas})`,
                  subtitle: `Kode: ${c.kode_mk}`,
                  type: "kuliah",
                  startTime: c.jam_mulai,
                  endTime: c.jam_selesai,
                  penanggungJawab: c.dosen,
                  keterangan: "Jadwal perkuliahan semester aktif program studi.",
                  sksOrPeserta: "3 SKS",
                });
              }
            });
          }
        } catch {
          // Fallback if table doesn't exist
          FALLBACK_COURSES.filter((f) => f.hari === hariName).forEach((c, idx) => {
            const targetRoom = ruanganList[idx % ruanganList.length];
            if (targetRoom) {
              collectedEvents.push({
                id: `mock-${idx}`,
                ruanganId: targetRoom.id,
                title: `${c.nama_mk} (${c.kelas})`,
                subtitle: `Kode: ${c.kode_mk}`,
                type: "kuliah",
                startTime: c.jam_mulai,
                endTime: c.jam_selesai,
                penanggungJawab: c.dosen,
                keterangan: "Jadwal perkuliahan semester aktif program studi.",
                sksOrPeserta: "3 SKS",
              });
            }
          });
        }
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setEvents(collectedEvents);
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [selectedDate, ruanganList]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() - (viewMode === "week" ? 7 : 1));
    setSelectedDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + (viewMode === "week" ? 7 : 1));
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Filtered Rooms
  const filteredRuangan = useMemo(() => {
    return ruanganList.filter((r) => {
      const matchGedung = selectedGedung === "all" || r.gedungNama === selectedGedung;
      const matchSearch =
        r.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.gedungNama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGedung && matchSearch;
    });
  }, [ruanganList, selectedGedung, searchQuery]);

  // Helper to calculate percentage position & width for an event bar
  const calculatePosition = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startDecimal = startH + startM / 60;
    const endDecimal = endH + endM / 60;

    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, startDecimal));
    const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, endDecimal));

    const left = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100;
    const width = Math.max(2, ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  // Date Formatting for Display
  const formattedDate = selectedDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedMonthYear = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const bookingBaseHref =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/peminjaman/baru"
      : "/dashboard/mahasiswa/peminjaman/baru";

  return (
    <div className="space-y-6">
      {/* Schedule Top Navigation Bar (Header seperti gambar referensi) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Date Arrow & Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200/70">
              <button
                onClick={handlePrevDay}
                className="w-8 h-8 rounded-xl hover:bg-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="w-8 h-8 rounded-xl hover:bg-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Hari Ini
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {formattedMonthYear}
              </h2>
              <p className="text-xs text-slate-400 capitalize">{formattedDate}</p>
            </div>
          </div>

          {/* Right: View Mode Toggle & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Switch: day / week */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 text-white text-xs font-semibold">
              <button
                onClick={() => setViewMode("day")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === "day"
                    ? "bg-sky-500 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                day
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === "week"
                    ? "bg-sky-500 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                week
              </button>
            </div>

            {/* Gedung Filter */}
            <select
              value={selectedGedung}
              onChange={(e) => setSelectedGedung(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Gedung</option>
              {gedungList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Search Room */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ruang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 w-32 sm:w-40 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Keterangan Warna Agenda:
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
            <span className="text-slate-600 font-medium">Peminjaman Disetujui (Sah)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500 shadow-2xs" />
            <span className="text-slate-600 font-medium">Peminjaman Diproses (Menunggu Verifikasi)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs" />
            <span className="text-slate-600 font-medium">Jadwal Kuliah (Mata Kuliah)</span>
          </div>
          <div className="ml-auto text-[11px] text-slate-400 font-medium hidden sm:block">
            💡 Klik pada balok kegiatan untuk melihat detail lengkap
          </div>
        </div>
      </div>

      {/* Resource Timeline Grid (Sesuai Desain Gambar Referensi FullCalendar Resource Timeline) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-sky-600" />
            <p className="text-xs font-semibold">Memuat timeline jadwal ruangan...</p>
          </div>
        ) : filteredRuangan.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada ruangan yang cocok dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              {/* Header Row */}
              <div className="grid grid-cols-[200px_1fr] border-b border-slate-200/90 bg-slate-50/80 sticky top-0 z-10 text-xs font-bold text-slate-700">
                <div className="p-3 border-r border-slate-200/90 flex items-center justify-between">
                  <span>Rooms</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    W {Math.ceil((selectedDate.getDate() + 6) / 7)}
                  </span>
                </div>
                <div className="grid grid-cols-14 divide-x divide-slate-200/70">
                  {timeHeaders.slice(0, 14).map((timeStr, idx) => (
                    <div key={idx} className="p-2.5 text-center text-[11px] font-semibold text-slate-500">
                      {timeStr.replace(":00", "")}
                      <span className="text-[9px] text-slate-400">
                        {parseInt(timeStr) < 12 ? "am" : "pm"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Rows */}
              <div className="divide-y divide-slate-100">
                {filteredRuangan.map((room) => {
                  const roomEvents = events.filter((e) => e.ruanganId === room.id);

                  return (
                    <div
                      key={room.id}
                      className="grid grid-cols-[200px_1fr] hover:bg-slate-50/40 transition-colors group"
                    >
                      {/* Left: Room Title Column */}
                      <div className="p-3.5 border-r border-slate-200/90 flex flex-col justify-center bg-white group-hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {room.kode}
                          </span>
                          <span className="text-[10px] text-slate-400" title={`Kapasitas: ${room.kapasitas} orang`}>
                            (?)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {room.gedungNama} {room.lantai ? `• Lt. ${room.lantai}` : ""}
                        </div>
                      </div>

                      {/* Right: Timeline Grid Column */}
                      <div className="relative h-14 bg-white">
                        {/* Background Hour Guidelines */}
                        <div className="absolute inset-0 grid grid-cols-14 divide-x divide-slate-100 pointer-events-none">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <div key={i} className="h-full" />
                          ))}
                        </div>

                        {/* Event Bars */}
                        {roomEvents.map((ev) => {
                          const pos = calculatePosition(ev.startTime, ev.endTime);

                          // Colors matching the prompt and screenshot
                          let badgeBg = "bg-sky-500 hover:bg-sky-600 text-white";
                          if (ev.type === "peminjaman_disetujui") {
                            badgeBg = "bg-emerald-600 hover:bg-emerald-700 text-white";
                          } else if (ev.type === "kuliah") {
                            badgeBg = "bg-amber-500 hover:bg-amber-600 text-white";
                          }

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              style={{ left: pos.left, width: pos.width }}
                              className={`absolute top-2 bottom-2 rounded-lg px-2.5 flex items-center justify-between text-xs font-semibold shadow-xs cursor-pointer transition-all duration-150 truncate hover:scale-[1.01] hover:z-20 ${badgeBg}`}
                              title={`${ev.title} (${ev.startTime} - ${ev.endTime})`}
                            >
                              <span className="truncate text-[11px] font-bold">
                                {ev.title}
                              </span>
                              <span className="text-[10px] opacity-90 font-mono ml-1 shrink-0 hidden md:inline">
                                {ev.startTime}-{ev.endTime}
                              </span>
                            </div>
                          );
                        })}

                        {/* Quick Booking Button on Empty Slots */}
                        {roomEvents.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`${bookingBaseHref}?ruangan=${room.id}&tanggal=${selectedDate.toISOString().split("T")[0]}`}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs"
                            >
                              + Pinjam Ruang
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal (Popup saat balok kegiatan diklik) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    selectedEvent.type === "peminjaman_disetujui"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedEvent.type === "kuliah"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-sky-100 text-sky-800"
                  }`}
                >
                  {selectedEvent.type === "peminjaman_disetujui"
                    ? "Peminjaman Disetujui (Izin Sah)"
                    : selectedEvent.type === "kuliah"
                    ? "Jadwal Mata Kuliah"
                    : "Peminjaman Sedang Diverifikasi"}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                  {selectedEvent.title}
                </h3>
                {selectedEvent.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3 text-slate-600">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Waktu: </strong> {selectedEvent.startTime} — {selectedEvent.endTime} WIB
                </span>
              </div>

              {selectedEvent.penanggungJawab && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Penanggung Jawab: </strong> {selectedEvent.penanggungJawab}
                  </span>
                </div>
              )}

              {selectedEvent.sksOrPeserta && (
                <div className="flex items-center gap-3 text-slate-600">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Kapasitas / SKS: </strong> {selectedEvent.sksOrPeserta}
                  </span>
                </div>
              )}

              {selectedEvent.keterangan && (
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 text-xs leading-relaxed mt-2 border border-slate-100">
                  <strong>Deskripsi:</strong> {selectedEvent.keterangan}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
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
