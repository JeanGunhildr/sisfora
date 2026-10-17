"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Trash2,
  Search,
  ExternalLink,
  Eye,
  AlertCircle,
  Users,
  ShieldCheck,
  FileText,
  Loader2,
  X,
  CreditCard,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusVerifikasi, UserProfile } from "@/lib/types";

interface UserVerificationManagerProps {
  adminId: string;
}

export default function UserVerificationManager({ adminId }: UserVerificationManagerProps) {
  const supabase = createClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | StatusVerifikasi>("semua");

  // State untuk Modal Preview KTM
  const [previewKtmUrl, setPreviewKtmUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>("");

  // State untuk Modal Tolak Akun
  const [rejectModalUser, setRejectModalUser] = useState<UserProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Alert Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "mahasiswa")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. SETUJUI AKUN
  const handleApprove = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("users")
        .update({
          status_verifikasi: "diverifikasi",
          diverifikasi_oleh: adminId,
          diverifikasi_pada: now,
          alasan_penolakan: null,
          updated_at: now,
        })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status_verifikasi: "diverifikasi", diverifikasi_oleh: adminId, diverifikasi_pada: now, alasan_penolakan: null }
            : u
        )
      );
      showFeedback("success", "Akun mahasiswa berhasil disetujui.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyetujui akun.";
      showFeedback("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. TOLAK AKUN
  const handleConfirmReject = async () => {
    if (!rejectModalUser) return;
    setActionLoadingId(rejectModalUser.id);

    try {
      const now = new Date().toISOString();
      const reason = rejectReason.trim() || "Berkas KTM tidak sesuai atau tidak terbaca jelas.";

      const { error } = await supabase
        .from("users")
        .update({
          status_verifikasi: "ditolak",
          diverifikasi_oleh: adminId,
          diverifikasi_pada: now,
          alasan_penolakan: reason,
          updated_at: now,
        })
        .eq("id", rejectModalUser.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === rejectModalUser.id
            ? { ...u, status_verifikasi: "ditolak", diverifikasi_oleh: adminId, diverifikasi_pada: now, alasan_penolakan: reason }
            : u
        )
      );

      showFeedback("success", `Akun ${rejectModalUser.nama} telah ditolak.`);
      setRejectModalUser(null);
      setRejectReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak akun.";
      showFeedback("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. RESET KE MENUNGGU
  const handleResetToPending = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("users")
        .update({
          status_verifikasi: "menunggu",
          diverifikasi_oleh: null,
          diverifikasi_pada: null,
          alasan_penolakan: null,
          updated_at: now,
        })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status_verifikasi: "menunggu", diverifikasi_oleh: null, diverifikasi_pada: null, alasan_penolakan: null }
            : u
        )
      );
      showFeedback("success", "Status akun dikembalikan ke Menunggu Verifikasi.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mereset status.";
      showFeedback("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. HAPUS AKUN
  const handleDeleteUser = async (user: UserProfile) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data pendaftaran mahasiswa ${user.nama} (${user.nim})?`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const { error } = await supabase.from("users").delete().eq("id", user.id);
      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showFeedback("success", `Data pendaftar ${user.nama} berhasil dihapus.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus akun.";
      showFeedback("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter & Search
  const filteredUsers = users.filter((u) => {
    const matchesFilter = filterStatus === "semua" || u.status_verifikasi === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      u.nama.toLowerCase().includes(query) ||
      (u.nim && u.nim.toLowerCase().includes(query)) ||
      u.email.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const countTotal = users.length;
  const countPending = users.filter((u) => u.status_verifikasi === "menunggu").length;
  const countApproved = users.filter((u) => u.status_verifikasi === "diverifikasi").length;
  const countRejected = users.filter((u) => u.status_verifikasi === "ditolak").length;

  return (
    <div className="w-full space-y-6 mt-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all shadow-md ${
            feedback.type === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-rose-500 text-white shadow-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Summary Stat Pills matching modern gradient cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus("semua")}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "semua"
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
              : "bg-white text-slate-700 border-slate-100 hover:border-blue-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">
              Total Pendaftar
            </span>
            <Users className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-2xl font-extrabold mt-2">{countTotal}</p>
        </button>

        <button
          onClick={() => setFilterStatus("menunggu")}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "menunggu"
              ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
              : "bg-white text-slate-700 border-slate-100 hover:border-amber-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">
              Menunggu Verifikasi
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-amber-600">
            {countPending}
          </p>
        </button>

        <button
          onClick={() => setFilterStatus("diverifikasi")}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "diverifikasi"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-700 border-slate-100 hover:border-emerald-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">
              Disetujui
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-emerald-600">
            {countApproved}
          </p>
        </button>

        <button
          onClick={() => setFilterStatus("ditolak")}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "ditolak"
              ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20"
              : "bg-white text-slate-700 border-slate-100 hover:border-rose-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">
              Ditolak
            </span>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-rose-600">
            {countRejected}
          </p>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Table: Search & Filter Tabs */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Manajemen Verifikasi Akun Mahasiswa
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Setujui atau tolak pendaftaran mahasiswa berdasarkan bukti fisik KTM
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIM, email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={fetchUsers}
              title="Refresh Data"
              className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Mahasiswa</th>
                <th className="py-3.5 px-4">NIM</th>
                <th className="py-3.5 px-4">Bukti Foto KTM</th>
                <th className="py-3.5 px-4">Tanggal Daftar</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Memuat data pendaftar...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada data mahasiswa ditemukan.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? "Coba ubah kata kunci pencarian Anda."
                        : "Belum ada pendaftaran dengan status ini."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isLoading = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nama & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs">
                              {u.nama}
                            </span>
                            <span className="text-slate-400 text-[11px] block mt-0.5">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* NIM */}
                      <td className="py-4 px-4 font-mono font-medium text-slate-700">
                        {u.nim || "-"}
                      </td>

                      {/* Bukti Foto KTM */}
                      <td className="py-4 px-4">
                        {u.url_ktm ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewKtmUrl(u.url_ktm || null);
                                setPreviewUserName(u.nama);
                              }}
                              className="group relative w-16 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs hover:border-blue-400 transition-all"
                            >
                              <img
                                src={u.url_ktm}
                                alt={`KTM ${u.nama}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                            <span className="text-[11px] text-blue-600 font-medium">
                              Lihat
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Tidak diunggah
                          </span>
                        )}
                      </td>

                      {/* Tanggal Daftar */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status Verifikasi Badge */}
                      <td className="py-4 px-4">
                        {u.status_verifikasi === "menunggu" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Menunggu
                          </span>
                        ) : u.status_verifikasi === "diverifikasi" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Disetujui
                          </span>
                        ) : (
                          <div className="group relative inline-block">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              Ditolak
                            </span>
                            {u.alasan_penolakan && (
                              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg z-30">
                                <span className="font-semibold block mb-0.5">Alasan Penolakan:</span>
                                {u.alasan_penolakan}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aksi CRUD */}
                      <td className="py-4 px-6 text-right">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600 inline-block" />
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Tombol Setujui */}
                            {u.status_verifikasi !== "diverifikasi" && (
                              <button
                                onClick={() => handleApprove(u.id)}
                                title="Setujui Akun"
                                className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                            )}

                            {/* Tombol Tolak */}
                            {u.status_verifikasi !== "ditolak" && (
                              <button
                                onClick={() => {
                                  setRejectModalUser(u);
                                  setRejectReason("");
                                }}
                                title="Tolak Akun"
                                className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            )}

                            {/* Tombol Reset ke Menunggu */}
                            {u.status_verifikasi !== "menunggu" && (
                              <button
                                onClick={() => handleResetToPending(u.id)}
                                title="Kembalikan ke Status Menunggu"
                                className="p-1.5 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Hapus Akun */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Hapus Data Pendaftar"
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: PREVIEW FOTO KTM FULL */}
      {previewKtmUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Bukti KTM Mahasiswa: <span className="text-blue-600">{previewUserName}</span>
                </h4>
              </div>
              <button
                onClick={() => setPreviewKtmUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 flex justify-center bg-slate-50 rounded-2xl my-4">
              <img
                src={previewKtmUrl}
                alt={`KTM ${previewUserName}`}
                className="max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={previewKtmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <span>Buka ukuran penuh di tab baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setPreviewKtmUrl(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TOLAK AKUN MAHASISWA */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Tolak Pendaftaran Mahasiswa
                </h4>
              </div>
              <button
                onClick={() => setRejectModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menolak pendaftaran akun mahasiswa untuk:{" "}
                <strong className="text-slate-800">{rejectModalUser.nama}</strong> ({rejectModalUser.nim}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alasan Penolakan (Akan Dilihat Mahasiswa)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Foto KTM buram atau nama pada KTM tidak sesuai dengan profil yang didaftarkan."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalUser(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
