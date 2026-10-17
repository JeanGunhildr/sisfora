"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Star, CheckCircle2, Loader2, Building2, AppWindow, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RuanganOption {
  id: string;
  kode: string;
  gedung?: { nama: string } | null;
}

export default function FeedbackPage() {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [jenisFeedback, setJenisFeedback] = useState<"ruangan" | "aplikasi">("ruangan");
  const [ruanganId, setRuanganId] = useState<string>("");
  const [komentar, setKentar] = useState("");
  const [rooms, setRooms] = useState<RuanganOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      const { data } = await supabase
        .from("ruangan")
        .select("id, kode, gedung:gedung_id(nama)")
        .eq("status_aktif", true)
        .order("kode");

      if (data) {
        setRooms(data as unknown as RuanganOption[]);
      }
    }
    loadRooms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!komentar.trim()) {
      setError("Pesan atau komentar feedback tidak boleh kosong.");
      return;
    }
    if (rating === 0) {
      setError("Mohon berikan rating bintang terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

      const { error: insertError } = await supabase.from("feedback").insert({
        user_id: user.id,
        jenis_feedback: jenisFeedback,
        ruangan_id: jenisFeedback === "ruangan" && ruanganId ? ruanganId : null,
        komentar: komentar.trim(),
        rating,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setRating(0);
      setKentar("");
      setRuanganId("");
      setJenisFeedback("ruangan");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim feedback.");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["", "Sangat Buruk", "Kurang Memuaskan", "Cukup Baik", "Bagus", "Sangat Memuaskan"];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Feedback & Ulasan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bantu kami meningkatkan kualitas fasilitas dan layanan aplikasi SISFORA Fakultas Teknik
        </p>
      </div>

      {success ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-12 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Terima Kasih atas Masukan Anda!</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
            Feedback Anda telah tercatat di sistem kami dan akan dievaluasi oleh Tim Administrasi Fakultas.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
          >
            Kirim Feedback Lainnya
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Formulir Evaluasi & Ulasan</h2>
              <p className="text-[11px] text-indigo-100">Bebas diisi untuk kategori ruangan maupun performa aplikasi</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Penilaian Kepuasan
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                {(hoverRating || rating) > 0 && (
                  <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                    {ratingLabels[hoverRating || rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Kategori Feedback: 'ruangan' atau 'aplikasi' (Sesuai Enum DB) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kategori Evaluasi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisFeedback("ruangan")}
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    jenisFeedback === "ruangan"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Building2 size={16} />
                  <span>Fasilitas Ruangan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJenisFeedback("aplikasi");
                    setRuanganId("");
                  }}
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    jenisFeedback === "aplikasi"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <AppWindow size={16} />
                  <span>Sistem / Aplikasi SISFORA</span>
                </button>
              </div>
            </div>

            {/* Pilihan Ruangan jika jenisFeedback === 'ruangan' */}
            {jenisFeedback === "ruangan" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Ruangan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <select
                  value={ruanganId}
                  onChange={(e) => setRuanganId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Semua Ruangan / Fasilitas Umum Fakultas</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Ruang {r.kode} — {Array.isArray(r.gedung) ? r.gedung[0]?.nama : r.gedung?.nama || "Fakultas"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Komentar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Komentar & Saran Masukan
              </label>
              <textarea
                rows={4}
                value={komentar}
                onChange={(e) => setKentar(e.target.value)}
                maxLength={1000}
                placeholder="Tuliskan pengalaman Anda, kebersihan ruangan, AC/proyektor, atau kendala peminjaman yang dihadapi..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1 text-right">{komentar.length}/1000 karakter</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? "Mengirim..." : "Kirim Masukan"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
