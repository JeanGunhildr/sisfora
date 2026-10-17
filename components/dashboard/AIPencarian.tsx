"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Sparkles, Loader2, Bot, User, Building2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  rooms?: RoomResult[];
}

interface RoomResult {
  id: string;
  nama: string;
  kode: string;
  kapasitas: number;
  luas: number;
  status_ketersediaan: string;
  lantai: number;
  nama_gedung?: string;
  fasilitas?: string[];
}

export default function AIPencarian() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya asisten pintar SISFORA. Anda bisa bertanya tentang ketersediaan ruangan, kapasitas, atau fasilitas dalam bahasa sehari-hari. Contoh: \"Carikan ruangan seminar untuk 50 orang yang ada AC dan proyektor di lantai 2\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Maaf, terjadi kesalahan: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "Berikut ruangan yang cocok dengan kebutuhan Anda:",
            rooms: data.rooms,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Fitur AI sedang dalam penyesuaian query. Anda dapat langsung menelusuri seluruh ruangan di menu Daftar Ruangan.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    tersedia: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ditahan: "bg-amber-50 text-amber-700 border-amber-200",
    digunakan: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const STATUS_LABEL: Record<string, string> = {
    tersedia: "Tersedia",
    ditahan: "Ditahan",
    digunakan: "Digunakan",
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">AI Assistant Pencari Ruangan</h3>
          <p className="text-[11px] text-indigo-100">Ketik kebutuhan Anda — AI menganalisis spesifikasi ruangan fakultas</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-[11px] text-white font-semibold">Siap Membantu</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-slate-200 text-slate-700 font-bold text-xs"
              }`}
            >
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>

            <div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-xs"
                    : "bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-xs"
                }`}
              >
                {msg.content}
              </div>

              {/* Room Results */}
              {msg.rooms && msg.rooms.length > 0 && (
                <div className="w-full space-y-2 pt-1">
                  {msg.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs flex items-start gap-3 hover:border-indigo-200 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{room.nama}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{room.kode}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              STATUS_COLOR[room.status_ketersediaan] || "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {STATUS_LABEL[room.status_ketersediaan] || room.status_ketersediaan}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Lantai {room.lantai} • Kapasitas {room.kapasitas} orang • Luas {room.luas} m²
                          {room.nama_gedung && ` • ${room.nama_gedung}`}
                        </p>
                        {room.fasilitas && room.fasilitas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {room.fasilitas.slice(0, 4).map((f, fIdx) => (
                              <span key={fIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 self-center">
                        {room.status_ketersediaan === "tersedia" ? (
                          <Link
                            href={`/dashboard/mahasiswa/peminjaman/baru?ruangan=${room.id}`}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <span>Ajukan</span>
                            <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-medium">
                            {room.status_ketersediaan === "ditahan" ? "Ditahan" : "Dipakai"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>AI sedang menganalisis database ruangan...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tanyakan rekomendasi ruangan (misal: 'ruangan ber-AC kapasitas 80 orang')..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
