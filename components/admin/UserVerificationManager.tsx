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
  CreditCard,
  Mail,
  User as UserIcon,
  X,
  UserCheck,
  UserX,
  AlertTriangle,
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

  // Tab or active view for rejected/active: we can display both or tab
  const [activeTab, setActiveTab] = useState<"aktif" | "ditolak">("aktif");

  // State Modal Preview KTM
  const [previewKtmUrl, setPreviewKtmUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>("");

  // State Modal Tolak Akun
  const [rejectModalUser, setRejectModalUser] = useState<UserProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // State Modal Konfirmasi Hapus Akun
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);

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
          status_verifikasi: "disetujui",
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
            ? { ...u, status_verifikasi: "disetujui", diverifikasi_oleh: adminId, diverifikasi_pada: now, alasan_penolakan: null }
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
      showFeedback("success", "Status akun dikembalikan ke Menunggu Persetujuan.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mereset status.";
      showFeedback("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. KONFIRMASI HAPUS AKUN
  const handleExecuteDelete = async () => {
    if (!deleteConfirmUser) return;
    setActionLoadingId(deleteConfirmUser.id);
    try {
      const { error } = await supabase.from("users").delete().eq("id", deleteConfirmUser.id);
      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      showFeedback("success", `Data akun mahasiswa ${deleteConfirmUser.nama} berhasil dihapus.`);
      setDeleteConfirmUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus akun.";
      showFeedback("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Search filtering
  const query = searchQuery.toLowerCase().trim();
  const filterBySearch = (u: UserProfile) => {
    if (!query) return true;
    return (
      u.nama.toLowerCase().includes(query) ||
      (u.nim && u.nim.toLowerCase().includes(query)) ||
      u.email.toLowerCase().includes(query)
    );
  };

  // List 1: Menunggu Persetujuan
  const pendingUsers = users.filter((u) => u.status_verifikasi === "menunggu" && filterBySearch(u));
  const rawPendingCount = users.filter((u) => u.status_verifikasi === "menunggu").length;

  // List 2: Mahasiswa Aktif / Diterima
  const approvedUsers = users.filter((u) => u.status_verifikasi === "disetujui" && filterBySearch(u));
  const rawApprovedCount = users.filter((u) => u.status_verifikasi === "disetujui").length;

  // List 3: Mahasiswa Ditolak
  const rejectedUsers = users.filter((u) => u.status_verifikasi === "ditolak" && filterBySearch(u));
  const rawRejectedCount = users.filter((u) => u.status_verifikasi === "ditolak").length;

  return (
    <div className="w-full space-y-8">
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

      {/* Global Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mahasiswa, NIM, atau email..."
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
          <span className="font-medium">Total Mahasiswa Terdaftar:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {users.length}
          </span>
        </div>
      </div>

      {/* ========================================================
          LIST 1: AKUN MENUNGGU PERSETUJUAN
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Akun Menunggu Persetujuan
              </h2>
              <p className="text-xs text-slate-500">
                Pendaftar yang memerlukan validasi kartu tanda mahasiswa (KTM)
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {rawPendingCount} Menunggu
          </span>
        </div>

        {/* Content list or empty state */}
        {pendingUsers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              Tidak ada akun yang menunggu persetujuan
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchQuery
                ? `Tidak ada data akun menunggu yang cocok dengan kata kunci "${searchQuery}".`
                : "Semua akun pendaftar telah diverifikasi atau belum ada pendaftar baru."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Mahasiswa</th>
                  <th className="py-3.5 px-6">NIM</th>
                  <th className="py-3.5 px-6">Bukti KTM</th>
                  <th className="py-3.5 px-6">Tgl Daftar</th>
                  <th className="py-3.5 px-6 text-right">Aksi Persetujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {u.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">{u.nama}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-700">
                      {u.nim || "-"}
                    </td>

                    <td className="py-4 px-6">
                      {u.url_ktm ? (
                        <button
                          onClick={() => {
                            setPreviewKtmUrl(u.url_ktm || null);
                            setPreviewUserName(u.nama);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-all cursor-pointer border border-indigo-200/60"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat KTM</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada berkas</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={actionLoadingId === u.id}
                          onClick={() => handleApprove(u.id)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          disabled={actionLoadingId === u.id}
                          onClick={() => {
                            setRejectModalUser(u);
                            setRejectReason("");
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          LIST 2 & 3: MAHASISWA AKTIF / DITERIMA & MAHASISWA DITOLAK
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Tab Header to switch between Mahasiswa Aktif and Mahasiswa Ditolak */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl self-start">
            <button
              onClick={() => setActiveTab("aktif")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "aktif"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Mahasiswa Aktif / Diterima ({rawApprovedCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("ditolak")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ditolak"
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <UserX className="w-4 h-4 text-rose-600" />
              <span>Mahasiswa Ditolak ({rawRejectedCount})</span>
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {activeTab === "aktif"
              ? "Daftar mahasiswa yang telah mendapatkan persetujuan akses peminjaman."
              : "Daftar mahasiswa yang permohonan aktivasinya ditolak beserta opsi hapus akun."}
          </span>
        </div>

        {/* Tab 1: Mahasiswa Aktif */}
        {activeTab === "aktif" && (
          <div>
            {approvedUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                {searchQuery
                  ? `Tidak ada mahasiswa aktif yang sesuai pencarian "${searchQuery}".`
                  : "Belum ada mahasiswa yang berstatus aktif."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">Mahasiswa</th>
                      <th className="py-3.5 px-6">NIM</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Bukti KTM</th>
                      <th className="py-3.5 px-6">Tgl Disetujui</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                              {u.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-xs sm:text-sm">{u.nama}</div>
                              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-semibold text-slate-700">
                          {u.nim || "-"}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {u.url_ktm ? (
                            <button
                              onClick={() => {
                                setPreviewKtmUrl(u.url_ktm || null);
                                setPreviewUserName(u.nama);
                              }}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat KTM</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-slate-500">
                          {u.diverifikasi_pada
                            ? new Date(u.diverifikasi_pada).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleResetToPending(u.id)}
                            title="Kembalikan ke status menunggu"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Mahasiswa Ditolak */}
        {activeTab === "ditolak" && (
          <div>
            {rejectedUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                {searchQuery
                  ? `Tidak ada mahasiswa ditolak yang sesuai pencarian "${searchQuery}".`
                  : "Tidak ada mahasiswa yang ditolak."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">Mahasiswa</th>
                      <th className="py-3.5 px-6">NIM</th>
                      <th className="py-3.5 px-6">Alasan Penolakan</th>
                      <th className="py-3.5 px-6">Bukti KTM</th>
                      <th className="py-3.5 px-6 text-right">Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rejectedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100/50 text-rose-600 flex items-center justify-center font-bold text-sm">
                              {u.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-xs sm:text-sm">{u.nama}</div>
                              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-semibold text-slate-700">
                          {u.nim || "-"}
                        </td>

                        <td className="py-4 px-6 max-w-xs">
                          <div className="text-rose-700 bg-rose-50/80 p-2.5 rounded-xl border border-rose-100 text-[11px] leading-relaxed">
                            {u.alasan_penolakan || "Tidak ada keterangan alasan."}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {u.url_ktm ? (
                            <button
                              onClick={() => {
                                setPreviewKtmUrl(u.url_ktm || null);
                                setPreviewUserName(u.nama);
                              }}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat KTM</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Pulihkan ke Menunggu */}
                            <button
                              onClick={() => handleResetToPending(u.id)}
                              title="Kembalikan ke status menunggu"
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Pulihkan</span>
                            </button>

                            {/* Tombol Hapus Akun (membuka Pop-up Konfirmasi Hapus) */}
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              title="Hapus Akun Mahasiswa"
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus Akun</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: PREVIEW FOTO KTM FULL
          ======================================================== */}
      {previewKtmUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Bukti KTM Mahasiswa: <span className="text-indigo-600">{previewUserName}</span>
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
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

      {/* ========================================================
          MODAL 2: TOLAK AKUN MAHASISWA (INPUT ALASAN)
          ======================================================== */}
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
                disabled={actionLoadingId === rejectModalUser.id}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: POP-UP KONFIRMASI HAPUS AKUN MAHASISWA
          ======================================================== */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Konfirmasi Hapus Akun
                </h4>
                <p className="text-[11px] text-slate-500">Tindakan ini permanen</p>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data akun mahasiswa:
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-800">{deleteConfirmUser.nama}</div>
                <div className="text-slate-500">NIM: {deleteConfirmUser.nim || "-"}</div>
                <div className="text-slate-500">Email: {deleteConfirmUser.email}</div>
              </div>
              <p className="text-[11px] text-rose-600 font-medium">
                Data pendaftaran dan akun mahasiswa ini akan dihapus secara permanen dari sistem.
              </p>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoadingId === deleteConfirmUser.id}
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
