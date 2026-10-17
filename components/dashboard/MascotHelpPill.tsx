"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, X, Compass, GitFork, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { RoleUser } from "@/lib/types";

interface MascotHelpPillProps {
  role?: RoleUser;
}

export default function MascotHelpPill({ role = "mahasiswa" }: MascotHelpPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedBubble, setDismissedBubble] = useState(false);

  const alurHref =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/alur-peminjaman"
      : "/dashboard/mahasiswa/alur-peminjaman";

  const ruanganHref =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/ruangan"
      : role === "admin"
      ? "/dashboard/admin/ruangan"
      : "/dashboard/mahasiswa/ruangan";

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end select-none">
      {/* Expanded Quick Help Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white/95 backdrop-blur-md rounded-3xl border border-amber-200/80 shadow-2xl shadow-amber-500/15 p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100/70">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center p-0.5 border border-amber-200 shadow-2xs">
                <Image
                  src="/maskot1.png"
                  alt="Merpi Sisfora"
                  width={34}
                  height={34}
                  className="object-contain"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Merpi • Maskot SISFORA
                </h4>
                <p className="text-[10px] text-amber-700 font-medium">
                  Merpati Pos Kampus Ramah
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Halo! Ada yang bisa Merpi bantu seputar peminjaman ruangan atau alur persetujuan surat fakultas?
            </p>

            <div className="mt-3 space-y-2">
              <Link
                href={alurHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/60 text-xs font-semibold text-amber-900 transition-colors group"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <GitFork className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">Panduan Alur Peminjaman</div>
                  <div className="text-[10px] text-amber-700/80 font-normal truncate">
                    Tahapan upload surat s.d tanda tangan
                  </div>
                </div>
              </Link>

              <Link
                href={ruanganHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/60 text-xs font-semibold text-sky-900 transition-colors group"
              >
                <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">Cek Ketersediaan Ruangan</div>
                  <div className="text-[10px] text-sky-700/80 font-normal truncate">
                    Fasilitas kelas, aula & laboratorium
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              Sistem Surat & Peminjaman Ruangan SISFORA
            </span>
          </div>
        </div>
      )}

      {/* Floating Greeting Speech Bubble (when collapsed and not dismissed) */}
      {!isOpen && !dismissedBubble && (
        <div className="mb-2 mr-2 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/90 shadow-lg shadow-amber-500/10 px-3.5 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-xs">
          <span className="text-xs font-semibold text-slate-800">
            Halo! Butuh bantuan surat & ruangan?
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissedBubble(true);
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            title="Sembunyikan pesan"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Mascot Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 pl-3 pr-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-sky-600 hover:from-amber-600 hover:to-sky-700 text-white rounded-full shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 active:scale-95 transition-all duration-200 border-2 border-white cursor-pointer"
        title="Tanya Merpi"
      >
        <div className="relative w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
          <Image
            src="/maskot1.png"
            alt="Maskot SISFORA"
            width={34}
            height={34}
            className="object-contain drop-shadow-md"
          />
        </div>
        <div className="text-left">
          <span className="text-xs font-bold leading-tight block">Tanya Merpi</span>
          <span className="text-[9px] text-amber-100 font-medium leading-tight block">
            Bantuan Cepat
          </span>
        </div>
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </button>
    </div>
  );
}
