"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Star, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const FEEDBACK_CATEGORIES = [
  { value: "fasilitas", label: "Fasilitas Ruangan" },
  { value: "proses", label: "Proses Pengajuan" },
  { value: "layanan", label: "Layanan Admin" },
  { value: "aplikasi", label: "Aplikasi SISFORA" },
  { value: "lainnya", label: "Lainnya" },
];

export default function FeedbackPage() {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [kategori, setKategori] = useState("fasilitas");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) {
      setError("Pesan feedback tidak boleh kosong.");
      return;
    }
    if (rating === 0) {
      setError("Mohon berikan rating terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Anda harus login.");

      const { error: insertError } = await supabase.from("feedback").insert({
        pengirim_id: user.id,
        kategori,
        pesan: pesan.trim(),
        rating,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setRating(0);
      setPesan("");
      setKategori("fasilitas");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim feedback.");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["", "Buruk", "Kurang Baik", "Cukup", "Baik", "Sangat Baik"];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bantu kami meningkatkan layanan dengan berbagi pengalaman Anda
        </p>
      </div>

      {success ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Terima Kasih!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Feedback Anda telah berhasil dikirim dan akan kami tinjau segera.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Kirim Feedback Lainnya
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Form Feedback SISFORA</h2>
              <p className="text-[11px] text-blue-100/80">Pendapat Anda sangat berarti bagi pengembangan kami</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Penilaian Keseluruhan
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
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
                {(hoverRating || rating) > 0 && (
                  <span className="ml-2 text-sm font-semibold text-amber-500">
                    {ratingLabels[hoverRating || rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kategori Feedback
              </label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setKategori(cat.value)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      kategori === cat.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pesan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pesan Feedback
              </label>
              <textarea
                rows={5}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Ceritakan pengalaman Anda menggunakan SISFORA, hal yang perlu diperbaiki, atau saran untuk pengembangan..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 text-right">{pesan.length}/1000 karakter</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Mengirim..." : "Kirim Feedback"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
