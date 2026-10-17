"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Award,
  FileCheck2,
  History,
  FileSignature,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoleUser } from "@/lib/types";

interface DashboardHeaderProps {
  nama: string;
  roleTitle: string;
  role?: RoleUser;
}

const ADMIN_FEATURES = [
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
    title: "Kelola Organisasi",
    desc: "Master lembaga kemahasiswaan (BEM, DPM, HIMA, UKM) & atur ketua",
    href: "/dashboard/admin/organisasi",
    icon: Award,
    keywords: ["organisasi", "ketua organisasi", "bem", "hima", "ukm", "dpm", "lembaga"],
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

const WD3_FEATURES = [
  {
    title: "Dashboard WD3",
    desc: "Statistik permohonan peminjaman sarana dan metrik persetujuan",
    href: "/dashboard/wd3",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "beranda", "statistik", "wd3", "overview", "ringkasan"],
  },
  {
    title: "Persetujuan Surat & TTD Digital",
    desc: "Tinjau surat umum & organisasi, bubuhkan tanda tangan digital",
    href: "/dashboard/wd3/persetujuan",
    icon: FileCheck2,
    keywords: ["persetujuan", "surat", "tanda tangan", "ttd", "digital", "approve", "acc", "validasi"],
  },
  {
    title: "Riwayat Persetujuan",
    desc: "Arsip seluruh permohonan yang telah disetujui atau ditolak",
    href: "/dashboard/wd3/riwayat",
    icon: History,
    keywords: ["riwayat", "history", "arsip", "disetujui", "ditolak", "dokumen"],
  },
];

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
  const [adminNotifs, setAdminNotifs] = useState({
    pendingUsers: 0,
    newLoans: 0,
    newFeedback: 0,
  });

  // WD3 Notification Count
  const [wd3PendingCount, setWd3PendingCount] = useState(0);

  useEffect(() => {
    const storageKey = role === "wd3" ? "sisfora_wd3_notifs_cleared" : "sisfora_admin_notifs_cleared";
    const cleared = sessionStorage.getItem(storageKey);
    if (cleared === "true") {
      setIsNotifCleared(true);
    }

    if (role === "admin") {
      const fetchAdminCounts = async () => {
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

          setAdminNotifs({
            pendingUsers: userCount || 0,
            newLoans: loanCount || 0,
            newFeedback: feedbackCount || 0,
          });
        } catch (e) {
          console.error("Error fetching admin notifications:", e);
        }
      };

      fetchAdminCounts();
    } else if (role === "wd3") {
      const fetchWd3Counts = async () => {
        try {
          const { data: pengajuanList, error: wd3Err } = await supabase
            .from("pengajuan")
            .select(`
              id,
              status,
              jenis_peminjaman,
              organisasi_id,
              dokumen_pengajuan:dokumen_pengajuan!dokumen_pengajuan_pengajuan_id_fkey (
                id,
                status_dokumen
              )
            `)
            .not("status", "in", '("disetujui","ditolak_wd3","ditolak_ketua","dibatalkan","kedaluwarsa")');

          if (wd3Err) {
            console.error("Gagal mengambil notifikasi WD3:", wd3Err);
            return;
          }

          const list = pengajuanList || [];
          const count = list.filter((item: any) => {
            const docs = item.dokumen_pengajuan || [];
            if (docs.length === 0 || item.status === "menunggu_upload") return false;

            const isOrganisasi =
              item.jenis_peminjaman === "organisasi" || Boolean(item.organisasi_id);

            if (isOrganisasi) {
              const isSignedByKetua = docs.some(
                (d: any) => d.status_dokumen === "ditandatangani_ketua"
              );
              return isSignedByKetua && item.status === "menunggu_wd3";
            }

            // Kategori Umum
            return item.status === "menunggu_wd3" || docs.some((d: any) => d.status_dokumen === "diunggah");
          }).length;

          setWd3PendingCount(count);
        } catch (e) {
          console.error("Error fetching WD3 notifications:", e);
        }
      };

      fetchWd3Counts();
    }
  }, [role]);

  // Click outside listener
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

  const rawAdminNotifs = adminNotifs.pendingUsers + adminNotifs.newLoans + adminNotifs.newFeedback;
  const displayAdminNotifs = isNotifCleared ? 0 : rawAdminNotifs;
  const displayWd3Notifs = isNotifCleared ? 0 : wd3PendingCount;

  // Clear notification numbers handler
  const handleClearNotifications = () => {
    setIsNotifCleared(true);
    const storageKey = role === "wd3" ? "sisfora_wd3_notifs_cleared" : "sisfora_admin_notifs_cleared";
    sessionStorage.setItem(storageKey, "true");
  };

  // Features list based on active role
  const activeFeatures = role === "admin" ? ADMIN_FEATURES : role === "wd3" ? WD3_FEATURES : [];

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
    if (activeFeatures.length > 0) {
      if (matchingFeatures.length > 0) {
        router.push(matchingFeatures[0].href);
        setShowSearchDropdown(false);
      }
    } else {
      if (!searchTerm.trim()) return;
      router.push(`/dashboard/mahasiswa/ruangan?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const isFeatureSearchable = role === "admin" || role === "wd3";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onFocus={() => {
              if (isFeatureSearchable) setShowSearchDropdown(true);
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (isFeatureSearchable) setShowSearchDropdown(true);
            }}
            placeholder={
              role === "admin"
                ? "Cari fitur, menu, atau navigasi admin..."
                : role === "wd3"
                ? "Cari fitur, persetujuan surat, riwayat WD3..."
                : "Cari ruangan, gedung, kapasitas, atau fasilitas..."
            }
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all text-slate-800"
          />
        </form>

        {/* Feature Search Dropdown for Admin & WD3 */}
        {isFeatureSearchable && showSearchDropdown && (
          <div className="absolute left-0 top-12 w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 flex items-center justify-between">
              <span>Navigasi Fitur {role === "admin" ? "Admin" : "Wakil Dekan 3"}</span>
              <span className="text-[10px] font-normal lowercase text-slate-400">
                Tekan enter untuk buka
              </span>
            </div>

            {matchingFeatures.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada menu atau fitur yang cocok dengan "{searchTerm}".
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
                      className="w-full p-2.5 rounded-2xl text-left hover:bg-indigo-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                            {f.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {f.desc}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Icons & Profile Info */}
      <div className="flex items-center gap-4 self-end sm:self-auto relative" ref={dropdownRef}>
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-800 leading-tight">Halo, {nama}</span>
          <span className="text-[11px] text-slate-400 font-medium">{roleTitle}</span>
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          onClick={() => setShowNotifications((prev) => !prev)}
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-2xs transition-all cursor-pointer relative ${
            showNotifications
              ? "bg-indigo-50 border-indigo-300 text-indigo-600"
              : "bg-white border-slate-200/80 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
          }`}
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {role === "admin" ? (
            displayAdminNotifs > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                {displayAdminNotifs}
              </span>
            )
          ) : role === "wd3" ? (
            displayWd3Notifs > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                {displayWd3Notifs}
              </span>
            )
          ) : (
            <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2.5 right-2.5 ring-2 ring-white" />
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifikasi {role === "wd3" ? "WD3" : "Sistem"}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {((role === "admin" && displayAdminNotifs > 0) ||
                  (role === "wd3" && displayWd3Notifs > 0)) && (
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
                          {adminNotifs.pendingUsers > 0
                            ? `${adminNotifs.pendingUsers} mahasiswa menunggu verifikasi KTM`
                            : "Tidak ada pendaftar menunggu"}
                        </div>
                      </div>
                    </div>
                    {adminNotifs.pendingUsers > 0 && !isNotifCleared && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {adminNotifs.pendingUsers}
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
                          {adminNotifs.newLoans > 0
                            ? `${adminNotifs.newLoans} data pengajuan peminjaman tercatat`
                            : "Belum ada pengajuan"}
                        </div>
                      </div>
                    </div>
                    {adminNotifs.newLoans > 0 && !isNotifCleared && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                        {adminNotifs.newLoans}
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
                          {adminNotifs.newFeedback > 0
                            ? `${adminNotifs.newFeedback} ulasan & feedback masuk`
                            : "Belum ada feedback"}
                        </div>
                      </div>
                    </div>
                    {adminNotifs.newFeedback > 0 && !isNotifCleared && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        {adminNotifs.newFeedback}
                      </span>
                    )}
                  </div>
                </>
              ) : role === "wd3" ? (
                <>
                  {/* WD3 Notification: Surat Menunggu Persetujuan */}
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/dashboard/wd3/persetujuan");
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-amber-50/80 border border-slate-100/80 hover:border-amber-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800">
                          Permohonan Siap Tanda Tangan
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {wd3PendingCount > 0
                            ? `${wd3PendingCount} permohonan menunggu persetujuan Anda`
                            : "Tidak ada permohonan tertunda"}
                        </div>
                      </div>
                    </div>
                    {wd3PendingCount > 0 && !isNotifCleared && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {wd3PendingCount}
                      </span>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/dashboard/wd3/riwayat");
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/80 border border-slate-100/80 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">
                          Arsip Surat
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Lihat riwayat surat yang telah disahkan atau ditolak
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
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
