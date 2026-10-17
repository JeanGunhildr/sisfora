"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Bell,
  Sparkles,
  Building2,
  MapPin,
  UserCheck,
  ClipboardList,
  MessageSquare,
  ExternalLink,
  X,
  LayoutDashboard,
  Compass,
  CheckCheck,
  ArrowRight,
  GitFork,
  Settings,
  PenTool,
  FileCheck2,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoleUser } from "@/lib/types";

interface DashboardHeaderProps {
  nama: string;
  roleTitle: string;
  role?: RoleUser;
}

interface NavFeature {
  title: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  keywords: string[];
}

const ADMIN_FEATURES: NavFeature[] = [
  {
    title: "Dashboard & Statistik",
    desc: "Ringkasan metrik mahasiswa, gedung, peminjaman, dan feedback",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    keywords: ["dashboard", "statistik", "metrik", "home", "beranda", "laporan", "overview"],
  },
  {
    title: "Verifikasi Akun Mahasiswa",
    desc: "Validasi KTM pendaftar, setujui, tolak, atau hapus akun",
    href: "/dashboard/admin/verifikasi",
    icon: UserCheck,
    keywords: ["verifikasi", "validasi", "ktm", "mahasiswa", "akun", "terima", "tolak", "pendaftar"],
  },
  {
    title: "Kelola Gedung",
    desc: "Tambah gedung baru, edit deskripsi, dan toggle status aktif",
    href: "/dashboard/admin/gedung",
    icon: Building2,
    keywords: ["gedung", "kelola gedung", "tambah gedung", "lokasi", "bangunan"],
  },
  {
    title: "Kelola Ruangan",
    desc: "Tambah ruangan, kapasitas, luas, lantai, upload foto, dan fasilitas",
    href: "/dashboard/admin/ruangan",
    icon: Compass,
    keywords: ["ruangan", "kelola ruangan", "tambah ruangan", "fasilitas", "kapasitas", "foto", "kelas", "lab"],
  },
  {
    title: "Monitoring Peminjaman",
    desc: "Pantau data pengajuan umum & organisasi beserta dokumen surat",
    href: "/dashboard/admin/peminjaman",
    icon: ClipboardList,
    keywords: ["peminjaman", "pengajuan", "monitoring peminjaman", "surat", "kegiatan", "jadwal"],
  },
  {
    title: "Monitoring Feedback",
    desc: "Evaluasi ulasan, penilaian rating bintang, dan masukan pengguna",
    href: "/dashboard/admin/feedback",
    icon: MessageSquare,
    keywords: ["feedback", "ulasan", "rating", "masukan", "komentar", "bintang", "review"],
  },
];

const MAHASISWA_FEATURES: NavFeature[] = [
  {
    title: "Dashboard Utama",
    desc: "Ringkasan ketersediaan ruangan, pengajuan aktif, dan rekomendasi",
    href: "/dashboard/mahasiswa",
    icon: LayoutDashboard,
    keywords: ["dashboard", "beranda", "home", "ringkasan", "statistik", "utama"],
  },
  {
    title: "Daftar & Cari Ruangan",
    desc: "Katalog ruangan kelas, lab, aula, kapasitas, dan fasilitas kampus",
    href: "/dashboard/mahasiswa/ruangan",
    icon: Compass,
    keywords: ["ruangan", "cari ruangan", "gedung", "katalog", "kelas", "lab", "aula", "fasilitas", "kapasitas"],
  },
  {
    title: "Panduan Alur Peminjaman",
    desc: "Tahapan pengajuan surat, verifikasi berkas, dan tanda tangan digital",
    href: "/dashboard/mahasiswa/alur-peminjaman",
    icon: GitFork,
    keywords: ["alur", "panduan", "cara pinjam", "prosedur", "tanda tangan", "ttd", "tahapan", "persyaratan"],
  },
  {
    title: "Status & Riwayat Peminjaman",
    desc: "Pantau proses verifikasi dokumen surat dan unduh izin resmi",
    href: "/dashboard/mahasiswa/peminjaman",
    icon: ClipboardList,
    keywords: ["status", "peminjaman", "riwayat", "surat", "izin", "pantau", "lacak", "dokumen", "terkini"],
  },
  {
    title: "Ajukan Peminjaman Baru",
    desc: "Formulir pengajuan peminjaman ruangan umum atau organisasi",
    href: "/dashboard/mahasiswa/peminjaman/baru",
    icon: Sparkles,
    keywords: ["ajukan", "pinjam", "baru", "formulir", "surat baru", "permohonan"],
  },
  {
    title: "Feedback & Ulasan",
    desc: "Beri rating bintang dan saran fasilitas ruangan atau aplikasi",
    href: "/dashboard/mahasiswa/feedback",
    icon: MessageSquare,
    keywords: ["feedback", "ulasan", "saran", "rating", "komentar", "masukan", "bintang"],
  },
  {
    title: "Pengaturan Akun",
    desc: "Informasi profil mahasiswa, nomor identitas (NIM), dan akun",
    href: "/dashboard/mahasiswa/pengaturan",
    icon: Settings,
    keywords: ["pengaturan", "profil", "akun", "nim", "password", "setting"],
  },
];

const KETUA_FEATURES: NavFeature[] = [
  {
    title: "Dashboard Ketua Organisasi",
    desc: "Ringkasan permohonan anggota yang menunggu tanda tangan",
    href: "/dashboard/ketua-organisasi",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "beranda", "ketua", "organisasi"],
  },
  {
    title: "Daftar Ruangan",
    desc: "Katalog ketersediaan ruangan kampus untuk kegiatan ormawa",
    href: "/dashboard/ketua-organisasi/ruangan",
    icon: Compass,
    keywords: ["ruangan", "gedung", "kelas", "lab", "fasilitas"],
  },
  {
    title: "Alur Peminjaman",
    desc: "Panduan prosedur peminjaman ruangan khusus organisasi",
    href: "/dashboard/ketua-organisasi/alur-peminjaman",
    icon: GitFork,
    keywords: ["alur", "panduan", "prosedur", "tahapan"],
  },
  {
    title: "Tanda Tangan Surat",
    desc: "Verifikasi dan bubuhkan tanda tangan digital pada proposal anggota",
    href: "/dashboard/ketua-organisasi/tanda-tangan",
    icon: PenTool,
    keywords: ["tanda tangan", "ttd", "surat", "verifikasi", "setujui", "dokumen"],
  },
  {
    title: "Status Peminjaman",
    desc: "Pantau pengajuan peminjaman kegiatan organisasi",
    href: "/dashboard/ketua-organisasi/peminjaman",
    icon: ClipboardList,
    keywords: ["status", "peminjaman", "pantau"],
  },
];

const WD3_FEATURES: NavFeature[] = [
  {
    title: "Dashboard WD3",
    desc: "Ringkasan permohonan peminjaman sarana fakultas",
    href: "/dashboard/wd3",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "beranda", "wd3", "dekanat"],
  },
  {
    title: "Persetujuan Surat",
    desc: "Tinjau dan bubuhkan tanda tangan digital dekanat pada surat izin",
    href: "/dashboard/wd3/tanda-tangan",
    icon: FileCheck2,
    keywords: ["persetujuan", "tanda tangan", "ttd", "surat", "verifikasi", "dokumen"],
  },
  {
    title: "Riwayat Persetujuan",
    desc: "Arsip berkas permohonan yang telah disetujui atau diproses",
    href: "/dashboard/wd3/riwayat",
    icon: ClipboardList,
    keywords: ["riwayat", "arsip", "surat selesai"],
  },
];

const FEATURES_BY_ROLE: Record<string, NavFeature[]> = {
  admin: ADMIN_FEATURES,
  mahasiswa: MAHASISWA_FEATURES,
  ketua_organisasi: KETUA_FEATURES,
  wd3: WD3_FEATURES,
};

export default function DashboardHeader({ nama, roleTitle, role }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNotifCleared, setIsNotifCleared] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Admin Notification Counts
  const [notifCounts, setNotifCounts] = useState({
    pendingUsers: 0,
    newLoans: 0,
    newFeedback: 0,
  });

  useEffect(() => {
    // Check if notification was cleared in local session
    const cleared = sessionStorage.getItem("sisfora_admin_notifs_cleared");
    if (cleared === "true") {
      setIsNotifCleared(true);
    }

    if (role === "admin") {
      const fetchCounts = async () => {
        try {
          const { count: userCount } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("status_verifikasi", "menunggu");

          const { count: loanCount } = await supabase
            .from("pengajuan")
            .select("*", { count: "exact", head: true });

          const { count: feedbackCount } = await supabase
            .from("feedback")
            .select("*", { count: "exact", head: true });

          setNotifCounts({
            pendingUsers: userCount || 0,
            newLoans: loanCount || 0,
            newFeedback: feedbackCount || 0,
          });
        } catch (e) {
          console.error("Error fetching notifications:", e);
        }
      };

      fetchCounts();
    }
  }, [role]);

  // Click outside listener for notification popup and search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rawTotalNotifs = notifCounts.pendingUsers + notifCounts.newLoans + notifCounts.newFeedback;
  const displayNotifCount = isNotifCleared ? 0 : rawTotalNotifs;

  // Clear notification numbers handler
  const handleClearNotifications = () => {
    setIsNotifCleared(true);
    sessionStorage.setItem("sisfora_admin_notifs_cleared", "true");
  };

  const currentRole = role || "mahasiswa";
  const activeFeatures = FEATURES_BY_ROLE[currentRole] || MAHASISWA_FEATURES;

  // Filter features for Quick Search
  const matchingFeatures = activeFeatures.filter((f) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      f.title.toLowerCase().includes(q) ||
      f.desc.toLowerCase().includes(q) ||
      f.keywords.some((k) => k.includes(q))
    );
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchingFeatures.length > 0) {
      router.push(matchingFeatures[0].href);
      setShowSearchDropdown(false);
    } else if (currentRole === "mahasiswa" && searchTerm.trim()) {
      router.push(`/dashboard/mahasiswa/ruangan?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearchDropdown(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSearchDropdown(true);
            }}
            placeholder={
              role === "admin"
                ? "Cari fitur, menu, atau navigasi admin..."
                : role === "mahasiswa"
                ? "Cari fitur mahasiswa (Alur, Ruangan, Status, Feedback)..."
                : "Cari fitur, menu, atau navigasi..."
            }
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs transition-all text-slate-800"
          />
        </form>

        {/* Feature Search Dropdown for Mahasiswa, Admin, etc. */}
        {showSearchDropdown && (
          <div className="absolute left-0 top-12 w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 flex items-center justify-between">
              <span>
                Navigasi Fitur {role === "admin" ? "Admin" : role === "ketua_organisasi" ? "Ketua Organisasi" : role === "wd3" ? "WD3" : "Mahasiswa"}
              </span>
              <span className="text-[10px] font-normal lowercase text-slate-400">
                Tekan enter untuk buka
              </span>
            </div>

            {matchingFeatures.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                <p>Tidak ada menu atau fitur yang cocok dengan "{searchTerm}".</p>
                {currentRole === "mahasiswa" && searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/dashboard/mahasiswa/ruangan?q=${encodeURIComponent(searchTerm.trim())}`);
                      setShowSearchDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Cari "{searchTerm}" di Katalog Ruangan</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="py-1 space-y-1">
                {matchingFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.href + f.title}
                      type="button"
                      onClick={() => {
                        router.push(f.href);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full p-2.5 rounded-2xl text-left hover:bg-sky-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-sky-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-sky-950">
                            {f.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {f.desc}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Icons & Profile Info */}
      <div className="flex items-center gap-3.5 self-end sm:self-auto relative" ref={dropdownRef}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-amber-100/90 border border-amber-200/90 hidden sm:flex items-center justify-center p-0.5 shadow-2xs">
            <Image
              src="/maskot1.png"
              alt="Merpi"
              width={26}
              height={26}
              className="object-contain"
            />
          </div>
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 leading-tight">Halo, {nama} 👋</span>
            <span className="text-[11px] text-amber-800/80 font-medium">{roleTitle}</span>
          </div>
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          onClick={() => setShowNotifications((prev) => !prev)}
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-2xs transition-all cursor-pointer relative ${
            showNotifications
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "bg-white border-slate-200/80 text-slate-500 hover:text-blue-600 hover:border-amber-300"
          }`}
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {role === "admin" ? (
            displayNotifCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                {displayNotifCount}
              </span>
            )
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2.5 right-2.5 ring-2 ring-white" />
          )}
        </button>

        {/* Notification Dropdown for Admin */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifikasi Sistem
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {role === "admin" && displayNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearNotifications}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    title="Bersihkan angka notifikasi"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Bersihkan</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-2 space-y-2">
              {role === "admin" ? (
                <>
                  {/* Item 1: Pendaftar Menunggu Verifikasi */}
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/dashboard/admin/verifikasi");
                    }}
                    className="p-3 rounded-2xl bg-slate-50/70 hover:bg-amber-50/80 border border-slate-100/80 hover:border-amber-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800">
                          Pendaftar Baru
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {notifCounts.pendingUsers > 0
                            ? `${notifCounts.pendingUsers} mahasiswa menunggu verifikasi KTM`
                            : "Tidak ada pendaftar menunggu"}
                        </div>
                      </div>
                    </div>
                    {notifCounts.pendingUsers > 0 && !isNotifCleared && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {notifCounts.pendingUsers}
                      </span>
                    )}
                  </div>

                  {/* Item 2: Pengajuan Peminjaman */}
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/dashboard/admin/peminjaman");
                    }}
                    className="p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/80 border border-slate-100/80 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">
                          Pengajuan Peminjaman
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {notifCounts.newLoans > 0
                            ? `${notifCounts.newLoans} data pengajuan peminjaman tercatat`
                            : "Belum ada pengajuan"}
                        </div>
                      </div>
                    </div>
                    {notifCounts.newLoans > 0 && !isNotifCleared && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                        {notifCounts.newLoans}
                      </span>
                    )}
                  </div>

                  {/* Item 3: Feedback Baru */}
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/dashboard/admin/feedback");
                    }}
                    className="p-3 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/80 border border-slate-100/80 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                          Feedback Pengguna
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {notifCounts.newFeedback > 0
                            ? `${notifCounts.newFeedback} ulasan & feedback masuk`
                            : "Belum ada feedback"}
                        </div>
                      </div>
                    </div>
                    {notifCounts.newFeedback > 0 && !isNotifCleared && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        {notifCounts.newFeedback}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Semua notifikasi sudah diperbarui.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
