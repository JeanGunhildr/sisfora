"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Star,
  RotateCw,
  Filter,
  CheckCircle2,
  Trash2,
  Compass,
  Laptop,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomSelect from "@/components/ui/CustomSelect";

export interface FeedbackItem {
  id: string;
  user_id: string;
  jenis_feedback: string;
  ruangan_id?: string | null;
  rating: number;
  komentar: string | null;
  status_moderasi: string;
  created_at: string;
  user?: {
    nama: string;
    nim?: string | null;
    email: string;
  };
  ruangan?: {
    kode: string;
    gedung?: {
      nama: string;
    };
  };
}

export default function MonitoringFeedbackView() {
  const supabase = createClient();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<string>("semua");
  const [filterJenis, setFilterJenis] = useState<string>("semua");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToastMsg({ type, msg });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          user:user_id (nama, nim, email),
          ruangan:ruangan_id (kode, gedung:gedung_id(nama))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks((data as any) || []);
    } catch (err: any) {
      console.error("Gagal mengambil data feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus masukan/feedback ini?")) {
      return;
    }

    setActionLoadingId(id);
    try {
      const { error } = await supabase.from("feedback").delete().eq("id", id);
      if (error) throw error;

      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      showToast("success", "Feedback berhasil dihapus.");
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus feedback.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Computations
  const totalCount = feedbacks.length;
  const avgRating =
    totalCount > 0
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalCount).toFixed(1)
      : "5.0";

  const ratingCounts = {
    5: feedbacks.filter((f) => f.rating === 5).length,
    4: feedbacks.filter((f) => f.rating === 4).length,
    3: feedbacks.filter((f) => f.rating === 3).length,
    2: feedbacks.filter((f) => f.rating === 2).length,
    1: feedbacks.filter((f) => f.rating === 1).length,
  };

  // Filtered
  const filteredFeedbacks = feedbacks.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (f.komentar && f.komentar.toLowerCase().includes(q)) ||
      (f.user?.nama && f.user.nama.toLowerCase().includes(q)) ||
      (f.user?.nim && f.user.nim.toLowerCase().includes(q)) ||
      (f.ruangan?.kode && f.ruangan.kode.toLowerCase().includes(q));

    const matchRating = filterRating === "semua" || String(f.rating) === filterRating;

    const matchJenis =
      filterJenis === "semua" ||
      (f.jenis_feedback && f.jenis_feedback.toLowerCase() === filterJenis.toLowerCase());

    return matchSearch && matchRating && matchJenis;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all shadow-md ${
            toastMsg.type === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-rose-500 text-white shadow-rose-500/20"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      {/* Ratings Overview Top Banner Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-200/50 flex flex-col items-center justify-center shrink-0">
            <span className="text-3xl font-extrabold text-amber-600">{avgRating}</span>
            <div className="flex text-amber-500 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-500" />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Kepuasan Pengguna & Masukan Ruangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Berdasarkan {totalCount} ulasan dan penilaian dari mahasiswa serta civitas akademika fakultas.
            </p>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="w-full md:w-72 space-y-1.5 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = (ratingCounts as any)[stars] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-3 text-right font-bold text-slate-600">{stars}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] text-slate-400 font-semibold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ulasan, nama, atau ruangan..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter Bintang */}
          <div className="w-full sm:w-44">
            <CustomSelect
              options={[
                { value: "semua", label: "Semua Bintang" },
                { value: "5", label: "⭐⭐⭐⭐⭐ (5)" },
                { value: "4", label: "⭐⭐⭐⭐ (4)" },
                { value: "3", label: "⭐⭐⭐ (3)" },
                { value: "2", label: "⭐⭐ (2)" },
                { value: "1", label: "⭐ (1)" },
              ]}
              value={filterRating}
              onChange={(val) => setFilterRating(val)}
              placeholder="Filter Bintang"
            />
          </div>

          {/* Filter Jenis */}
          <div className="w-full sm:w-52">
            <CustomSelect
              options={[
                { value: "semua", label: "Semua Kategori" },
                { value: "ruangan", label: "Fasilitas Ruangan" },
                { value: "aplikasi", label: "Sistem & Aplikasi" },
              ]}
              value={filterJenis}
              onChange={(val) => setFilterJenis(val)}
              placeholder="Filter Kategori"
            />
          </div>
        </div>

        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-end md:self-auto"
          title="Refresh Data"
        >
          <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Feedback Review Cards List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Daftar Masukan & Feedback
              </h2>
              <p className="text-xs text-slate-500">
                Ulasan kualitas ruangan dan masukan sistem dari civitas akademika
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {filteredFeedbacks.length} Ulasan
          </span>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchQuery || filterRating !== "semua" || filterJenis !== "semua"
              ? "Tidak ada feedback yang sesuai dengan kriteria filter."
              : "Belum ada feedback yang masuk dari mahasiswa."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.map((f) => (
              <div key={f.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {f.user?.nama ? f.user.nama.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {f.user?.nama || "Mahasiswa"}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>NIM: {f.user?.nim || "-"}</span>
                        <span>•</span>
                        <span>{new Date(f.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating stars & Badges */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (f.rating || 0)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200 fill-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    {f.ruangan ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                        <Compass className="w-3 h-3" />
                        {f.ruangan.kode}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        <Laptop className="w-3 h-3" />
                        {f.jenis_feedback || "Aplikasi"}
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteFeedback(f.id)}
                      disabled={actionLoadingId === f.id}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comment body */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  "{f.komentar || "Tidak ada komentar tertulis, hanya memberi penilaian bintang."}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
