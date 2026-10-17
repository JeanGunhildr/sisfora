"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, User } from "lucide-react";
import { RoleUser, ROLE_LABELS } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  nama?: string;
  role?: RoleUser;
  nim?: string | null;
}

export default function Topbar({ nama = "Pengguna", role = "mahasiswa", nim }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm px-6 py-3.5 mb-6 flex items-center justify-between">
      {/* Brand Logo matching Rampay style */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 block leading-none">
            SISFORA
          </span>
          <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase block mt-1">
            Fakultas
          </span>
        </div>
      </div>

      {/* Center Navigation Links matching reference */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
        <span className="text-blue-600 font-semibold cursor-default">
          Dashboard
        </span>
        <span className="hover:text-slate-900 transition-colors cursor-default text-slate-400">
          Kategori: {ROLE_LABELS[role]}
        </span>
      </nav>

      {/* Right User Capsule & Action Pill matching reference image */}
      <div className="flex items-center gap-3">
        {/* User Profile Pill */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center text-xs font-bold">
            {nama ? nama.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {nama}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>

        {/* Blue Action Pill Button matching "Free Trial" in image */}
        <button
          onClick={handleLogout}
          type="button"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
