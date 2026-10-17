"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Building2,
  MessageSquare,
  ClipboardList,
  Settings,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Users,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  PenTool,
  Eye,
  HelpCircle,
  Compass,
  Award,
  GitFork,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RoleUser, ROLE_LABELS } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<RoleUser, NavItem[]> = {
  mahasiswa: [
    { label: "Dashboard", href: "/dashboard/mahasiswa", icon: LayoutDashboard },
    { label: "Daftar Ruangan", href: "/dashboard/mahasiswa/ruangan", icon: Compass },
    { label: "Alur Peminjaman", href: "/dashboard/mahasiswa/alur-peminjaman", icon: GitFork },
    { label: "Status Peminjaman", href: "/dashboard/mahasiswa/peminjaman", icon: ClipboardList },
    { label: "Feedback", href: "/dashboard/mahasiswa/feedback", icon: MessageSquare },
  ],
  ketua_organisasi: [
    { label: "Dashboard", href: "/dashboard/ketua-organisasi", icon: LayoutDashboard },
    { label: "Daftar Ruangan", href: "/dashboard/ketua-organisasi/ruangan", icon: Compass },
    { label: "Alur Peminjaman", href: "/dashboard/ketua-organisasi/alur-peminjaman", icon: GitFork },
    { label: "Status Peminjaman", href: "/dashboard/ketua-organisasi/peminjaman", icon: ClipboardList },
    { label: "Tanda Tangan Surat", href: "/dashboard/ketua-organisasi/tanda-tangan", icon: PenTool },
    { label: "Feedback", href: "/dashboard/ketua-organisasi/feedback", icon: MessageSquare },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Verifikasi Akun", href: "/dashboard/admin/verifikasi", icon: Users },
    { label: "Kelola Organisasi", href: "/dashboard/admin/organisasi", icon: Award },
    { label: "Kelola Gedung", href: "/dashboard/admin/gedung", icon: Building2 },
    { label: "Kelola Ruangan", href: "/dashboard/admin/ruangan", icon: Compass },
    { label: "Monitoring Peminjaman", href: "/dashboard/admin/peminjaman", icon: ClipboardList },
    { label: "Monitoring Feedback", href: "/dashboard/admin/feedback", icon: MessageSquare },
  ],
  wd3: [
    { label: "Dashboard", href: "/dashboard/wd3", icon: LayoutDashboard },
    { label: "Persetujuan Surat", href: "/dashboard/wd3/persetujuan", icon: FileCheck2 },
    { label: "Riwayat Persetujuan", href: "/dashboard/wd3/riwayat", icon: Eye },
  ],
};

interface DashboardSidebarProps {
  role: RoleUser;
  nama: string;
  nim?: string | null;
}

export default function DashboardSidebar({ role, nama, nim }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = NAV_ITEMS[role] || NAV_ITEMS.mahasiswa;
  const settingsHref =
    role === "mahasiswa"
      ? "/dashboard/mahasiswa/pengaturan"
      : role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/pengaturan"
      : "#";

  return (
    <aside
      className={`relative flex flex-col shrink-0 h-screen overflow-y-auto bg-white border-r border-slate-100 transition-all duration-300 z-20 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <Link href={`/dashboard/${role === "ketua_organisasi" ? "ketua-organisasi" : role}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                Sisfora
              </span>
              <span className="text-[10px] font-medium text-slate-400 block tracking-wider uppercase">
                Portal Fasilitas
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-2 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Main Menu Section */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MAIN MENU
              </p>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const rootDashboard = `/dashboard/${role === "ketua_organisasi" ? "ketua-organisasi" : role}`;
                const isActive =
                  pathname === item.href ||
                  (item.href !== rootDashboard && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm transition-all group ${
                      isActive
                        ? "bg-[#ECEFFE] text-indigo-600 font-semibold shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Setting Section */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                SETTING
              </p>
            )}
            <nav className="space-y-1">
              {settingsHref !== "#" && (
                <Link
                  href={settingsHref}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm transition-all group ${
                    pathname === settingsHref
                      ? "bg-[#ECEFFE] text-indigo-600 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? "Pengaturan" : undefined}
                >
                  <Settings className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  {!collapsed && <span className="truncate">Pengaturan</span>}
                </Link>
              )}

              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 font-medium transition-all cursor-pointer group ${
                  collapsed ? "justify-center px-0" : ""
                }`}
                title={collapsed ? "Logout" : undefined}
              >
                <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-rose-500" />
                {!collapsed && <span className="truncate">Keluar</span>}
              </button>
            </nav>
          </div>
        </div>

        {/* User Card at Bottom */}
        {!collapsed && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {nama.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {nama}
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                {ROLE_LABELS[role]}
                {nim && ` • ${nim}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3.5 top-8 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition-all cursor-pointer z-30"
        title={collapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
