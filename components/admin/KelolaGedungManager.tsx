"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Compass,
  Power,
  RotateCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface GedungItem {
  id: string;
  nama: string;
  deskripsi: string | null;
  status_aktif: boolean;
  created_at: string;
  updated_at: string;
  jumlah_ruangan?: number;
}

export default function KelolaGedungManager() {
  const supabase = createClient();

  const [gedungs, setGedungs] = useState<GedungItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGedung, setEditingGedung] = useState<GedungItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    status_aktif: true,
  });

  // Modal State for Delete Confirmation
  const [deleteConfirmGedung, setDeleteConfirmGedung] = useState<GedungItem | null>(null);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchGedung = async () => {
    setLoading(true);
    try {
      const { data: gData, error: gError } = await supabase
        .from("gedung")
        .select("*")
        .order("nama", { ascending: true });

      if (gError) throw gError;

      // Count rooms per gedung
      const { data: rData } = await supabase.from("ruangan").select("gedung_id");
      const roomCounts: Record<string, number> = {};
      if (rData) {
        rData.forEach((r) => {
          if (r.gedung_id) {
            roomCounts[r.gedung_id] = (roomCounts[r.gedung_id] || 0) + 1;
          }
        });
      }

      const merged = (gData || []).map((g) => ({
        ...g,
        jumlah_ruangan: roomCounts[g.id] || 0,
      }));

      setGedungs(merged);
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal memuat data gedung.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGedung();
  }, []);

  const handleOpenAdd = () => {
    setEditingGedung(null);
    setFormData({
      nama: "",
      deskripsi: "",
      status_aktif: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (g: GedungItem) => {
    setEditingGedung(g);
    setFormData({
      nama: g.nama,
      deskripsi: g.deskripsi || "",
      status_aktif: g.status_aktif,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showFeedback("error", "Nama Gedung wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date().toISOString();

      if (editingGedung) {
        // UPDATE
        const { error } = await supabase
          .from("gedung")
          .update({
            nama: formData.nama.trim(),
            deskripsi: formData.deskripsi.trim() || null,
            status_aktif: formData.status_aktif,
            updated_at: now,
          })
          .eq("id", editingGedung.id);

        if (error) throw error;
        showFeedback("success", `Gedung "${formData.nama}" berhasil diperbarui.`);
      } else {
        // CREATE
        const { error } = await supabase.from("gedung").insert({
          nama: formData.nama.trim(),
          deskripsi: formData.deskripsi.trim() || null,
          status_aktif: formData.status_aktif,
          created_at: now,
          updated_at: now,
        });

        if (error) throw error;
        showFeedback("success", `Gedung baru "${formData.nama}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      fetchGedung();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menyimpan data gedung.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (g: GedungItem) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("gedung")
        .update({ status_aktif: !g.status_aktif, updated_at: new Date().toISOString() })
        .eq("id", g.id);

      if (error) throw error;

      setGedungs((prev) =>
        prev.map((item) => (item.id === g.id ? { ...item, status_aktif: !item.status_aktif } : item))
      );
      showFeedback(
        "success",
        `Status gedung "${g.nama}" diubah menjadi ${!g.status_aktif ? "Aktif" : "Nonaktif"}.`
      );
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal mengubah status gedung.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmGedung) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("gedung").delete().eq("id", deleteConfirmGedung.id);
      if (error) throw error;

      setGedungs((prev) => prev.filter((g) => g.id !== deleteConfirmGedung.id));
      showFeedback("success", `Gedung "${deleteConfirmGedung.nama}" berhasil dihapus.`);
      setDeleteConfirmGedung(null);
    } catch (err: any) {
      showFeedback(
        "error",
        err.message?.includes("foreign key")
          ? "Gedung tidak dapat dihapus karena masih memiliki ruangan terkait. Hapus ruangan terlebih dahulu."
          : err.message || "Gagal menghapus gedung."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered by Search
  const filteredGedungs = gedungs.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.nama.toLowerCase().includes(q) ||
      (g.deskripsi && g.deskripsi.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
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
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Top Controls: Search + Add Button */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama gedung..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchGedung}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Gedung</span>
          </button>
        </div>
      </div>

      {/* Table of Buildings */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Daftar Gedung Fakultas
              </h2>
              <p className="text-xs text-slate-500">
                Data master gedung dan lokasi fasilitas di lingkungan fakultas
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {gedungs.length} Gedung
          </span>
        </div>

        {filteredGedungs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchQuery
              ? `Tidak ada gedung yang cocok dengan kata kunci "${searchQuery}".`
              : "Belum ada data gedung yang dibuat."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Nama Gedung</th>
                  <th className="py-3.5 px-6">Deskripsi</th>
                  <th className="py-3.5 px-6 text-center">Jumlah Ruangan</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGedungs.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span>{g.nama}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-500 max-w-sm truncate">
                      {g.deskripsi || "-"}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        <Compass className="w-3 h-3 text-indigo-600" />
                        {g.jumlah_ruangan || 0} Ruangan
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(g)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          g.status_aktif
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            g.status_aktif ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {g.status_aktif ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Gedung"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmGedung(g)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Gedung"
                        >
                          <Trash2 className="w-4 h-4" />
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
          MODAL: TAMBAH / EDIT GEDUNG (TANPA KODE GEDUNG)
          ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {editingGedung ? "Edit Data Gedung" : "Tambah Gedung Baru"}
                </h4>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Gedung <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung Perkuliahan Bersama A"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={3}
                  placeholder="Keterangan fasilitas atau letak gedung..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formData.status_aktif}
                  onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="statusAktif" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Status Aktif (Dapat digunakan untuk peminjaman)
                </label>
              </div>

              <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  {editingGedung ? "Simpan Perubahan" : "Tambahkan Gedung"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS GEDUNG (TANPA KODE GEDUNG)
          ======================================================== */}
      {deleteConfirmGedung && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Konfirmasi Hapus Gedung
                </h4>
                <p className="text-[11px] text-slate-500">Tindakan ini permanen</p>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data gedung berikut?
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-800 text-sm">{deleteConfirmGedung.nama}</div>
                <div className="text-indigo-600 font-semibold mt-1">
                  Jumlah Ruangan Terdaftar: {deleteConfirmGedung.jumlah_ruangan || 0}
                </div>
              </div>
              <p className="text-[11px] text-rose-600 font-medium">
                Peringatan: Gedung yang memiliki ruangan tidak dapat dihapus sebelum ruangannya dihapus terlebih dahulu.
              </p>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmGedung(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Gedung</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
