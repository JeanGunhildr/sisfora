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
  UserCheck,
  User,
  Users,
  RotateCw,
  Award,
  Crown,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomSelect, { OptionItem } from "@/components/ui/CustomSelect";

export interface OrganisasiItem {
  id: string;
  nama: string;
  singkatan: string | null;
  deskripsi: string | null;
  status_aktif: boolean;
  ketua_id: string | null;
  created_at: string;
  ketua?: {
    id: string;
    nama: string;
    nim?: string | null;
    email: string;
    role?: string;
  } | null;
}

interface MahasiswaCandidate {
  id: string;
  nama: string;
  nim?: string | null;
  email: string;
  role: string;
}

export default function KelolaOrganisasiManager() {
  const supabase = createClient();

  const [organisasis, setOrganisasis] = useState<OrganisasiItem[]>([]);
  const [candidates, setCandidates] = useState<MahasiswaCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganisasiItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    singkatan: "",
    deskripsi: "",
    ketua_id: "",
    status_aktif: true,
  });

  // Modal State for Dedicated Set/Ganti Ketua
  const [setKetuaModalOrg, setSetKetuaModalOrg] = useState<OrganisasiItem | null>(null);
  const [selectedKetuaId, setSelectedKetuaId] = useState<string>("");

  // Modal State for Delete Confirmation
  const [deleteConfirmOrg, setDeleteConfirmOrg] = useState<OrganisasiItem | null>(null);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Organisasi with joined Ketua
      const { data: oData, error: oError } = await supabase
        .from("organisasi")
        .select(`
          *,
          ketua:ketua_id (id, nama, nim, email, role)
        `)
        .order("nama", { ascending: true });

      if (oError) throw oError;
      setOrganisasis((oData as any) || []);

      // 2. Fetch candidates for Ketua (mahasiswa yang aktif/disetujui atau sudah ketua)
      const { data: uData, error: uError } = await supabase
        .from("users")
        .select("id, nama, nim, email, role")
        .in("role", ["mahasiswa", "ketua_organisasi"])
        .eq("status_verifikasi", "disetujui")
        .order("nama", { ascending: true });

      if (uError) throw uError;
      setCandidates(uData || []);
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal memuat data organisasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingOrg(null);
    setFormData({
      nama: "",
      singkatan: "",
      deskripsi: "",
      ketua_id: "",
      status_aktif: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (org: OrganisasiItem) => {
    setEditingOrg(org);
    setFormData({
      nama: org.nama,
      singkatan: org.singkatan || "",
      deskripsi: org.deskripsi || "",
      ketua_id: org.ketua_id || "",
      status_aktif: org.status_aktif,
    });
    setModalOpen(true);
  };

  // Helper function to sync user role when ketua is assigned / unassigned
  const syncUserRoles = async (newKetuaId: string | null, oldKetuaId: string | null) => {
    // 1. If new ketua selected, update role to 'ketua_organisasi'
    if (newKetuaId) {
      await supabase
        .from("users")
        .update({ role: "ketua_organisasi", updated_at: new Date().toISOString() })
        .eq("id", newKetuaId);
    }

    // 2. If old ketua replaced, check if they are still ketua of any other organization
    if (oldKetuaId && oldKetuaId !== newKetuaId) {
      const { data: otherOrgs } = await supabase
        .from("organisasi")
        .select("id")
        .eq("ketua_id", oldKetuaId);

      if (!otherOrgs || otherOrgs.length === 0) {
        // Revert back to mahasiswa
        await supabase
          .from("users")
          .update({ role: "mahasiswa", updated_at: new Date().toISOString() })
          .eq("id", oldKetuaId);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showFeedback("error", "Nama Organisasi wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      const targetKetuaId = formData.ketua_id.trim() || null;

      // Rule: 1 organisasi maksimal 1 ketua.
      // Check if selected ketua is already leading another organization
      if (targetKetuaId) {
        const existingLeaderOrg = organisasis.find(
          (o) => o.ketua_id === targetKetuaId && (!editingOrg || o.id !== editingOrg.id)
        );

        if (existingLeaderOrg) {
          // Unset from the other organization to enforce strict 1-to-1 leader rule
          await supabase
            .from("organisasi")
            .update({ ketua_id: null })
            .eq("id", existingLeaderOrg.id);
        }
      }

      if (editingOrg) {
        // UPDATE
        const { error } = await supabase
          .from("organisasi")
          .update({
            nama: formData.nama.trim(),
            singkatan: formData.singkatan.trim().toUpperCase() || null,
            deskripsi: formData.deskripsi.trim() || null,
            ketua_id: targetKetuaId,
            status_aktif: formData.status_aktif,
          })
          .eq("id", editingOrg.id);

        if (error) throw error;

        await syncUserRoles(targetKetuaId, editingOrg.ketua_id);
        showFeedback("success", `Organisasi "${formData.nama}" berhasil diperbarui.`);
      } else {
        // CREATE
        const { data: newOrg, error } = await supabase
          .from("organisasi")
          .insert({
            nama: formData.nama.trim(),
            singkatan: formData.singkatan.trim().toUpperCase() || null,
            deskripsi: formData.deskripsi.trim() || null,
            ketua_id: targetKetuaId,
            status_aktif: formData.status_aktif,
          })
          .select()
          .single();

        if (error) throw error;

        await syncUserRoles(targetKetuaId, null);
        showFeedback("success", `Organisasi baru "${formData.nama}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menyimpan data organisasi.");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Set / Ganti Ketua Organisasi
  const handleOpenSetKetua = (org: OrganisasiItem) => {
    setSetKetuaModalOrg(org);
    setSelectedKetuaId(org.ketua_id || "");
  };

  const handleSaveSetKetua = async () => {
    if (!setKetuaModalOrg) return;
    setActionLoading(true);
    try {
      const targetId = selectedKetuaId.trim() || null;

      // If user is already leader of another organization, unset them there
      if (targetId) {
        const otherOrg = organisasis.find(
          (o) => o.ketua_id === targetId && o.id !== setKetuaModalOrg.id
        );
        if (otherOrg) {
          await supabase.from("organisasi").update({ ketua_id: null }).eq("id", otherOrg.id);
        }
      }

      const { error } = await supabase
        .from("organisasi")
        .update({ ketua_id: targetId })
        .eq("id", setKetuaModalOrg.id);

      if (error) throw error;

      await syncUserRoles(targetId, setKetuaModalOrg.ketua_id);

      showFeedback(
        "success",
        targetId
          ? `Ketua organisasi untuk "${setKetuaModalOrg.nama}" berhasil diperbarui.`
          : `Ketua organisasi "${setKetuaModalOrg.nama}" berhasil dikosongkan.`
      );

      setSetKetuaModalOrg(null);
      fetchData();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal mengatur ketua organisasi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (org: OrganisasiItem) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("organisasi")
        .update({ status_aktif: !org.status_aktif })
        .eq("id", org.id);

      if (error) throw error;

      setOrganisasis((prev) =>
        prev.map((item) =>
          item.id === org.id ? { ...item, status_aktif: !item.status_aktif } : item
        )
      );
      showFeedback(
        "success",
        `Status organisasi "${org.nama}" diubah menjadi ${!org.status_aktif ? "Aktif" : "Nonaktif"}.`
      );
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal mengubah status organisasi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmOrg) return;
    setActionLoading(true);
    try {
      // Revert role of ketua if necessary
      if (deleteConfirmOrg.ketua_id) {
        await syncUserRoles(null, deleteConfirmOrg.ketua_id);
      }

      const { error } = await supabase.from("organisasi").delete().eq("id", deleteConfirmOrg.id);
      if (error) throw error;

      setOrganisasis((prev) => prev.filter((o) => o.id !== deleteConfirmOrg.id));
      showFeedback("success", `Organisasi "${deleteConfirmOrg.nama}" berhasil dihapus.`);
      setDeleteConfirmOrg(null);
    } catch (err: any) {
      showFeedback(
        "error",
        err.message?.includes("foreign key")
          ? "Organisasi tidak dapat dihapus karena masih tercatat dalam riwayat pengajuan peminjaman."
          : err.message || "Gagal menghapus organisasi."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Candidates for CustomSelect
  const ketuaOptions: OptionItem[] = [
    { value: "", label: "-- Belum Ditentukan (Kosongkan) --" },
    ...candidates.map((c) => {
      const existingOrg = organisasis.find((o) => o.ketua_id === c.id);
      return {
        value: c.id,
        label: `${c.nama} (${c.nim || "Tanpa NIM"})`,
        badge: existingOrg ? `Ketua: ${existingOrg.singkatan || existingOrg.nama}` : undefined,
      };
    }),
  ];

  // Filtered by Search
  const filteredOrgs = organisasis.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.nama.toLowerCase().includes(q) ||
      (o.singkatan && o.singkatan.toLowerCase().includes(q)) ||
      (o.ketua?.nama && o.ketua.nama.toLowerCase().includes(q)) ||
      (o.ketua?.nim && o.ketua.nim.toLowerCase().includes(q))
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

      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama organisasi, singkatan, atau nama ketua..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Organisasi</span>
          </button>
        </div>
      </div>

      {/* Table of Organizations */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Daftar Organisasi Mahasiswa
              </h2>
              <p className="text-xs text-slate-500">
                Kelola data BEM, DPM, Himpunan Mahasiswa (HIMA), dan UKM fakultas beserta ketuanya
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {organisasis.length} Organisasi
          </span>
        </div>

        {filteredOrgs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchQuery
              ? `Tidak ada organisasi yang cocok dengan kata kunci "${searchQuery}".`
              : "Belum ada data organisasi yang dibuat."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Organisasi</th>
                  <th className="py-3.5 px-6">Ketua Organisasi (Maks. 1)</th>
                  <th className="py-3.5 px-6">Deskripsi</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Organisasi Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {org.singkatan ? org.singkatan.slice(0, 3) : org.nama.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{org.nama}</div>
                          {org.singkatan && (
                            <div className="text-indigo-600 font-mono text-[11px] font-semibold">
                              {org.singkatan}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Ketua Organisasi */}
                    <td className="py-4 px-6">
                      {org.ketua ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Crown className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs sm:text-sm">
                              {org.ketua.nama}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              NIM: {org.ketua.nim || "-"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-[11px] font-medium italic">
                            Belum ditentukan
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenSetKetua(org)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            + Tetapkan
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Deskripsi */}
                    <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                      {org.deskripsi || "-"}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(org)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          org.status_aktif
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            org.status_aktif ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {org.status_aktif ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSetKetua(org)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Atur / Ganti Ketua Organisasi"
                        >
                          <Crown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(org)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Organisasi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmOrg(org)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Organisasi"
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
          MODAL 1: TAMBAH / EDIT ORGANISASI
          ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {editingOrg ? "Edit Data Organisasi" : "Tambah Organisasi Baru"}
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
                  Nama Lengkap Organisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Badan Eksekutif Mahasiswa (BEM)"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Singkatan / Akronim
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BEM, DPM, HIMA-IF"
                  value={formData.singkatan}
                  onChange={(e) => setFormData({ ...formData, singkatan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Ketua Organisasi (1 Organisasi Maks. 1 Ketua)
                </label>
                <CustomSelect
                  options={ketuaOptions}
                  value={formData.ketua_id}
                  onChange={(val) => setFormData({ ...formData, ketua_id: val })}
                  placeholder="-- Pilih Mahasiswa Sebagai Ketua --"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mahasiswa yang dipilih akan otomatis mendapatkan hak akses sebagai Ketua Organisasi untuk menandatangani surat.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Profil Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan bidang kegiatan organisasi..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="statusAktifOrg"
                  checked={formData.status_aktif}
                  onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="statusAktifOrg" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Status Aktif (Dapat dipilih pada formulir peminjaman)
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
                  {editingOrg ? "Simpan Perubahan" : "Tambahkan Organisasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ATUR / GANTI KETUA ORGANISASI (DEDICATED)
          ======================================================== */}
      {setKetuaModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <Crown className="w-5 h-5" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Atur Ketua Organisasi
                </h4>
              </div>
              <button
                onClick={() => setSetKetuaModalOrg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tetapkan penanggung jawab / Ketua Organisasi untuk:{" "}
                <strong className="text-slate-800">{setKetuaModalOrg.nama}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Mahasiswa Calon Ketua
                </label>
                <CustomSelect
                  options={ketuaOptions}
                  value={selectedKetuaId}
                  onChange={(val) => setSelectedKetuaId(val)}
                  placeholder="-- Pilih Mahasiswa --"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold">Ketentuan 1 Organisasi = Maksimal 1 Ketua:</p>
                <p>
                  Setiap organisasi hanya dapat memiliki 1 orang ketua aktif. Akun yang dipilih akan diberikan hak tanda tangan surat peminjaman organisasi ini.
                </p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSetKetuaModalOrg(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveSetKetua}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
              >
                Simpan Penugasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: KONFIRMASI HAPUS ORGANISASI
          ======================================================== */}
      {deleteConfirmOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Konfirmasi Hapus Organisasi
                </h4>
                <p className="text-[11px] text-slate-500">Tindakan ini permanen</p>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data organisasi berikut?
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-800">{deleteConfirmOrg.nama}</div>
                {deleteConfirmOrg.singkatan && (
                  <div className="text-indigo-600 font-mono font-bold mt-0.5">
                    Akronim: {deleteConfirmOrg.singkatan}
                  </div>
                )}
                <div className="text-slate-500 mt-1">
                  Ketua: {deleteConfirmOrg.ketua?.nama || "Tidak ada"}
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrg(null)}
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
                <span>Ya, Hapus Organisasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
