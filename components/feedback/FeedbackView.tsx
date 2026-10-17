"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MessageSquare, Send, Star, CheckCircle2, Loader2, Building2, AppWindow, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RuanganOption {
  id: string;
  kode: string;
  gedung?: { nama: string } | null;
}

export default function FeedbackView() {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [jenisFeedback, setJenisFeedback] = useState<"ruangan" | "aplikasi">("ruangan");
  const [ruanganId, setRuanganId] = useState<string>("");
  const [komentar, setKomentar] = useState("");
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

      const payload: any = {
        user_id: user.id,
        rating,
        komentar: komentar.trim(),
        status_moderasi: "ditinjau",
      };

      if (jenisFeedback === "ruangan" && ruanganId) {
        payload.ruangan_id = ruanganId;
      }

      const { error: insertError } = await supabase.from("feedback").insert(payload);

      if (insertError) throw insertError;

      setSuccess(true);
      setKomentar("");
      setRating(0);
      setRuanganId("");
    } catch (err: any) {
      setError(err.message || "Gagal mengirim ulasan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Beri Ulasan &amp; Feedback
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Suaramu sangat berarti untuk meningkatkan kualitas fasilitas ruangan dan layanan sistem SISFORA
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
        {success ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in duration-300">
            <div className="relative w-20 h-20 mx-auto drop-shadow-md">
              <Image src="/maskot1.png" alt="Merpi" width={80} height={80} className="object-contain" />
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Terima Kasih Atas Ulasanmu!</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Masukan Anda telah berhasil dicatat dan akan menjadi evaluasi berkala bagi pengelola sarana fakultas.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer"
            >
              Kirim Ulasan Lainnya
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Pilih Kategori Ulasan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisFeedback("ruangan")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    jenisFeedback === "ruangan"
                      ? "border-amber-400 bg-amber-50/60 text-amber-950 ring-2 ring-amber-400/20"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold">Fasilitas Ruangan</div>
                    <div className="text-[10px] text-slate-400">AC, proyektor, kebersihan</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisFeedback("aplikasi")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    jenisFeedback === "aplikasi"
                      ? "border-amber-400 bg-amber-50/60 text-amber-950 ring-2 ring-amber-400/20"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <AppWindow className="w-4 h-4 text-sky-600" />
                  <div>
                    <div className="text-xs font-bold">Sistem Aplikasi</div>
                    <div className="text-[10px] text-slate-400">Kemudahan &amp; alur surat</div>
                  </div>
                </button>
              </div>
            </div>

            {jenisFeedback === "ruangan" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-800">
                  Ruangan Terkait (Opsional)
                </label>
                <select
                  value={ruanganId}
                  onChange={(e) => setRuanganId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Pilih Ruangan...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Ruang {r.kode} ({r.gedung?.nama || "Gedung"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Rating Kepuasan
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        (hoverRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-500 ml-2">
                  {rating === 1 && "Sangat Buruk"}
                  {rating === 2 && "Kurang Memuaskan"}
                  {rating === 3 && "Cukup Baik"}
                  {rating === 4 && "Bagus"}
                  {rating === 5 && "Sangat Memuaskan & Rekomended"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pesan / Saran Perbaikan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                placeholder="Tuliskan pengalaman atau kendala yang dihadapi (contoh: AC ruang 201 kurang dingin, atau alur surat sangat cepat)..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Ulasan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Ulasan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
