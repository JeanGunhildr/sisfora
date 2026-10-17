"use client";

import React, { useState } from "react";
import { Search, Bell, Sparkles, Building2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  nama: string;
  roleTitle: string;
}

export default function DashboardHeader({ nama, roleTitle }: DashboardHeaderProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/dashboard/mahasiswa/ruangan?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      {/* Search Input Bar (Skillery style) */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari ruangan, gedung, kapasitas, atau fasilitas..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all text-slate-800"
        />
      </form>

      {/* Right Action Icons & Profile Info */}
      <div className="flex items-center gap-4 self-end sm:self-auto">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-800 leading-tight">Halo, {nama}</span>
          <span className="text-[11px] text-slate-400 font-medium">{roleTitle}</span>
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-2xs transition-all cursor-pointer relative"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2.5 right-2.5 ring-2 ring-white" />
        </button>
      </div>
    </div>
  );
}
