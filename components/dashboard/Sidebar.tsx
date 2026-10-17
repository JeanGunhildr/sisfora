"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserCheck,
  Building2,
  CalendarCheck2,
  FileCheck2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RoleUser, ROLE_LABELS } from "@/lib/types";

interface SidebarProps {
  role?: RoleUser;
  nama?: string;
}

export default function Sidebar({ role = "mahasiswa", nama }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getRoleIcon = () => {
    switch (role) {
      case "admin":
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case "wd3":
        return <FileCheck2 className="w-4 h-4 text-amber-300" />;
      case "ketua_organisasi":
        return <Building2 className="w-4 h-4 text-cyan-300" />;
      default:
        return <GraduationCap className="w-4 h-4 text-blue-200" />;
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 min-h-screen">
      {/* Top Brand Banner matching image style */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/15 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2.5 shadow-inner">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SISFORA</h1>
          <p className="text-xs text-blue-100/90 font-normal mt-0.5">
            Sistem Peminjaman Ruangan
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-medium text-white">
            {getRoleIcon()}
            <span>{ROLE_LABELS[role]}</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-2 space-y-1.5">
        <Link
          href={`/dashboard/${role === "ketua_organisasi" ? "ketua-organisasi" : role}`}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
            pathname.startsWith("/dashboard")
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
              : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/70"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span>Dashboard</span>
        </Link>
      </nav>

      {/* Logout Action at Bottom */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
