"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Building2,
  Users,
  Maximize2,
  RotateCw,
  Image as ImageIcon,
  Layers,
  Upload,
  Check,
  Eye,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GedungItem } from "./KelolaGedungManager";
import CustomSelect, { OptionItem } from "@/components/ui/CustomSelect";

export interface FasilitasMaster {
  id: string;
  nama: string;
  deskripsi: string | null;
  satuan: string | null;
  status_aktif: boolean;
}

export interface RuanganFasilitasItem {
  id?: string;
  fasilitas_id: string;
  jumlah: number;
  keterangan?: string | null;
  fasilitas?: {
    id: string;
    nama: string;
    satuan: string | null;
  };
}

export interface RuanganItem {
  id: string;
  gedung_id: string;
  kode: string;
  deskripsi: string | null;
  kapasitas: number;
  luas_m2: number | null;
  lantai: number | null;
  posisi_denah: any | null;
  url_foto: string | null;
  status_aktif: boolean;
  created_at: string;
  updated_at: string;
  gedung?: {
    id: string;
    nama: string;
  };
  ruangan_fasilitas?: RuanganFasilitasItem[];
}

export default function KelolaRuanganManager() {
  const supabase = createClient();

  const [ruangans, setRuangans] = useState<RuanganItem[]>([]);
  const [gedungs, setGedungs] = useState<Array<{ id: string; nama: string; status_aktif?: boolean }>>([]);
  const [fasilitasList, setFasilitasList] = useState<FasilitasMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGedungId, setFilterGedungId] = useState<string>("semua");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRuangan, setEditingRuangan] = useState<RuanganItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    gedung_id: "",
    kode: "",
    kapasitas: 30,
    luas_m2: 45,
    lantai: 1,
    deskripsi: "",
    url_foto: "",
    status_aktif: true,
  });

  // Selected Facilities State in Form: { [fasilitas_id]: { selected: boolean, jumlah: number, keterangan: string } }
  const [selectedFasilitas, setSelectedFasilitas] = useState<
    Record<string, { selected: boolean; jumlah: number; keterangan: string }>
  >({});

  // Image Upload State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State for Delete Confirmation
  const [deleteConfirmRuangan, setDeleteConfirmRuangan] = useState<RuanganItem | null>(null);

  // Modal State for Viewing Room Detail & Facilities
  const [viewDetailRuangan, setViewDetailRuangan] = useState<RuanganItem | null>(null);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Gedung options
      const { data: gData, error: gError } = await supabase
        .from("gedung")
        .select("id, nama, status_aktif")
        .order("nama", { ascending: true });
      if (gError) throw gError;
      setGedungs(gData || []);

      // 2. Fetch Master Fasilitas
      const { data: fData, error: fError } = await supabase
        .from("fasilitas")
        .select("*")
        .order("nama", { ascending: true });
      if (fError) throw fError;
      setFasilitasList(fData || []);

      // 3. Fetch Ruangan with Gedung and Ruangan_Fasilitas
      const { data: rData, error: rError } = await supabase
        .from("ruangan")
        .select(`
          *,
          gedung:gedung_id (id, nama),
          ruangan_fasilitas (
            id,
            fasilitas_id,
            jumlah,
            keterangan,
            fasilitas:fasilitas_id (id, nama, satuan)
          )
        `)
        .order("kode", { ascending: true });

      if (rError) throw rError;
      setRuangans((rData as any) || []);
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal memuat data ruangan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showFeedback("error", "Harap pilih berkas foto gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback("error", "Ukuran foto maksimal adalah 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setImagePreview(base64Url);
      setFormData((prev) => ({ ...prev, url_foto: base64Url }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingRuangan(null);
    setImagePreview(null);
    setFormData({
      gedung_id: gedungs.length > 0 ? gedungs[0].id : "",
      kode: "",
      kapasitas: 30,
      luas_m2: 45,
      lantai: 1,
      deskripsi: "",
      url_foto: "",
      status_aktif: true,
    });

    // Reset fasilitas state
    const initialFas: Record<string, { selected: boolean; jumlah: number; keterangan: string }> = {};
    fasilitasList.forEach((f) => {
      initialFas[f.id] = { selected: false, jumlah: 1, keterangan: "" };
    });
    setSelectedFasilitas(initialFas);

    setModalOpen(true);
  };

  const handleOpenEdit = (r: RuanganItem) => {
    setEditingRuangan(r);
    setImagePreview(r.url_foto || null);
    setFormData({
      gedung_id: r.gedung_id,
      kode: r.kode,
      kapasitas: r.kapasitas || 1,
      luas_m2: r.luas_m2 || 0,
      lantai: r.lantai || 1,
      deskripsi: r.deskripsi || "",
      url_foto: r.url_foto || "",
      status_aktif: r.status_aktif,
    });

    // Populate facilities state
    const currentFas: Record<string, { selected: boolean; jumlah: number; keterangan: string }> = {};
    fasilitasList.forEach((f) => {
      const existing = (r.ruangan_fasilitas || []).find((rf) => rf.fasilitas_id === f.id);
      if (existing) {
        currentFas[f.id] = {
          selected: true,
          jumlah: existing.jumlah || 1,
          keterangan: existing.keterangan || "",
        };
      } else {
        currentFas[f.id] = { selected: false, jumlah: 1, keterangan: "" };
      }
    });
    setSelectedFasilitas(currentFas);

    setModalOpen(true);
  };

  const handleToggleFasilitas = (fasilitasId: string) => {
    setSelectedFasilitas((prev) => ({
      ...prev,
      [fasilitasId]: {
        ...prev[fasilitasId],
        selected: !prev[fasilitasId]?.selected,
      },
    }));
  };

  const handleFasilitasJumlahChange = (fasilitasId: string, jumlah: number) => {
    setSelectedFasilitas((prev) => ({
      ...prev,
      [fasilitasId]: {
        ...prev[fasilitasId],
        jumlah: Math.max(1, jumlah),
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode.trim() || !formData.gedung_id) {
      showFeedback("error", "Kode Ruangan dan Gedung wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      let targetRoomId = editingRuangan?.id;

      if (editingRuangan) {
        // 1. UPDATE RUANGAN
        const { error: rError } = await supabase
          .from("ruangan")
          .update({
            gedung_id: formData.gedung_id,
            kode: formData.kode.trim().toUpperCase(),
            kapasitas: Number(formData.kapasitas) || 1,
            luas_m2: Number(formData.luas_m2) || null,
            lantai: Number(formData.lantai) || 1,
            deskripsi: formData.deskripsi.trim() || null,
            url_foto: formData.url_foto || null,
            status_aktif: formData.status_aktif,
            updated_at: now,
          })
          .eq("id", editingRuangan.id);

        if (rError) throw rError;
      } else {
        // 1. CREATE RUANGAN
        const { data: newRoom, error: rError } = await supabase
          .from("ruangan")
          .insert({
            gedung_id: formData.gedung_id,
            kode: formData.kode.trim().toUpperCase(),
            kapasitas: Number(formData.kapasitas) || 1,
            luas_m2: Number(formData.luas_m2) || null,
            lantai: Number(formData.lantai) || 1,
            deskripsi: formData.deskripsi.trim() || null,
            url_foto: formData.url_foto || null,
            status_aktif: formData.status_aktif,
            created_at: now,
            updated_at: now,
          })
          .select("id")
          .single();

        if (rError) throw rError;
        targetRoomId = newRoom.id;
      }

      // 2. SYNC RUANGAN_FASILITAS (1 ruangan punya banyak fasilitas)
      if (targetRoomId) {
        // Delete existing relations
        await supabase.from("ruangan_fasilitas").delete().eq("ruangan_id", targetRoomId);

        // Prepare selected facilities
        const facilitiesToInsert = Object.entries(selectedFasilitas)
          .filter(([_, val]) => val.selected)
          .map(([fasId, val]) => ({
            ruangan_id: targetRoomId,
            fasilitas_id: fasId,
            jumlah: val.jumlah,
            keterangan: val.keterangan || null,
          }));

        if (facilitiesToInsert.length > 0) {
          const { error: fInsertError } = await supabase
            .from("ruangan_fasilitas")
            .insert(facilitiesToInsert);
          if (fInsertError) console.error("Error inserting facilities:", fInsertError);
        }
      }

      showFeedback(
        "success",
        editingRuangan
          ? `Ruangan "${formData.kode}" beserta fasilitas berhasil diperbarui.`
          : `Ruangan "${formData.kode}" berhasil ditambahkan.`
      );

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menyimpan data ruangan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (r: RuanganItem) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("ruangan")
        .update({ status_aktif: !r.status_aktif, updated_at: new Date().toISOString() })
        .eq("id", r.id);

      if (error) throw error;

      setRuangans((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, status_aktif: !item.status_aktif } : item))
      );
      showFeedback(
        "success",
        `Status ruangan "${r.kode}" diubah menjadi ${!r.status_aktif ? "Aktif" : "Nonaktif"}.`
      );
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal mengubah status ruangan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmRuangan) return;
    setActionLoading(true);
    try {
      // 1. Delete associated ruangan_fasilitas first
      await supabase.from("ruangan_fasilitas").delete().eq("ruangan_id", deleteConfirmRuangan.id);

      // 2. Delete ruangan
      const { error } = await supabase.from("ruangan").delete().eq("id", deleteConfirmRuangan.id);
      if (error) throw error;

      setRuangans((prev) => prev.filter((r) => r.id !== deleteConfirmRuangan.id));
      showFeedback("success", `Ruangan "${deleteConfirmRuangan.kode}" berhasil dihapus.`);
      setDeleteConfirmRuangan(null);
    } catch (err: any) {
      showFeedback(
        "error",
        err.message?.includes("foreign key")
          ? "Ruangan tidak dapat dihapus karena tercatat dalam histori pengajuan peminjaman."
          : err.message || "Gagal menghapus ruangan."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Gedung options for CustomSelect
  const gedungFilterOptions: OptionItem[] = [
    { value: "semua", label: "Semua Gedung" },
    ...gedungs.map((g) => ({
      value: g.id,
      label: g.nama,
    })),
  ];

  const gedungFormOptions: OptionItem[] = gedungs.map((g) => ({
    value: g.id,
    label: g.nama,
  }));

  // Filtered by Search & Gedung
  const filteredRuangans = ruangans.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.kode.toLowerCase().includes(q) ||
      (r.gedung?.nama && r.gedung.nama.toLowerCase().includes(q)) ||
      (r.deskripsi && r.deskripsi.toLowerCase().includes(q));

    const matchGedung = filterGedungId === "semua" || r.gedung_id === filterGedungId;

    return matchSearch && matchGedung;
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

      {/* Top Filter and Search Bar with Custom Dropdown */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode ruangan atau gedung..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Styled CustomSelect for Gedung Filter */}
          <div className="w-full sm:w-60">
            <CustomSelect
              options={gedungFilterOptions}
              value={filterGedungId}
              onChange={(val) => setFilterGedungId(val)}
              placeholder="Pilih Gedung..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchData}
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
            <span>Tambah Ruangan</span>
          </button>
        </div>
      </div>

      {/* Table of Rooms */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Daftar Ruangan & Fasilitas
              </h2>
              <p className="text-xs text-slate-500">
                Kelola foto, kapasitas tampung, lantai, dan kelengkapan fasilitas tiap ruangan
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {ruangans.length} Ruangan
          </span>
        </div>

        {filteredRuangans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchQuery || filterGedungId !== "semua"
              ? "Tidak ada ruangan yang cocok dengan filter pencarian."
              : "Belum ada data ruangan yang dibuat."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Foto & Ruangan</th>
                  <th className="py-3.5 px-6">Gedung</th>
                  <th className="py-3.5 px-6 text-center">Kapasitas</th>
                  <th className="py-3.5 px-6">Detail Fasilitas Terpasang</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRuangans.map((r) => {
                  const facilities = r.ruangan_fasilitas || [];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Foto & Kode */}
                      <td className="py-4 px-6 font-mono font-bold text-indigo-600">
                        <div className="flex items-center gap-3">
                          {r.url_foto ? (
                            <img
                              src={r.url_foto}
                              alt={r.kode}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200/60">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-extrabold text-slate-800 block">
                              {r.kode}
                            </span>
                            <span className="text-[11px] font-normal text-slate-400">
                              Lt. {r.lantai || 1} {r.luas_m2 ? `• ${r.luas_m2} m²` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Gedung */}
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {r.gedung?.nama || "Tanpa Gedung"}
                      </td>

                      {/* Kapasitas */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 font-semibold text-indigo-700 text-[11px]">
                          <Users className="w-3 h-3" />
                          {r.kapasitas} Orang
                        </span>
                      </td>

                      {/* Detail Fasilitas Chips */}
                      <td className="py-4 px-6 max-w-xs">
                        {facilities.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">
                            Belum ada fasilitas terdaftar
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {facilities.slice(0, 3).map((rf, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-medium"
                              >
                                <span>{rf.fasilitas?.nama || "Fasilitas"}</span>
                                <span className="font-bold text-indigo-600">({rf.jumlah})</span>
                              </span>
                            ))}
                            {facilities.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setViewDetailRuangan(r)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold cursor-pointer"
                              >
                                +{facilities.length - 3} lainnya
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Aktif */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(r)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            r.status_aktif
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status_aktif ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {r.status_aktif ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewDetailRuangan(r)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Lihat Detail Fasilitas & Foto"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Ruangan & Fasilitas"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmRuangan(r)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Ruangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: TAMBAH / EDIT RUANGAN (DENGAN UPLOAD GAMBAR & MULTI FASILITAS)
          ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {editingRuangan ? "Edit Data Ruangan & Fasilitas" : "Tambah Ruangan & Fasilitas Baru"}
                </h4>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-5">
              {/* Gedung Pilihan dengan CustomSelect */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Gedung Fakultas <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  options={gedungFormOptions}
                  value={formData.gedung_id}
                  onChange={(val) => setFormData({ ...formData, gedung_id: val })}
                  placeholder="-- Pilih Gedung --"
                />
              </div>

              {/* Kode Ruangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Ruangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: R-101, LAB-KOMP-1, AUDITORIUM"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Grid: Kapasitas, Lantai, Luas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.kapasitas}
                    onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lantai
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lantai}
                    onChange={(e) => setFormData({ ...formData, lantai: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Luas (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.luas_m2}
                    onChange={(e) => setFormData({ ...formData, luas_m2: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Upload Foto Ruangan (File Input) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foto Ruangan (Unggah Gambar Langsung)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  {imagePreview ? (
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs group">
                      <img
                        src={imagePreview}
                        alt="Preview Foto"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, url_foto: "" }));
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs cursor-pointer hover:bg-rose-700"
                        title="Hapus foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="roomImageUpload"
                    />
                    <label
                      htmlFor="roomImageUpload"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 shadow-2xs cursor-pointer transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>{imagePreview ? "Ganti Foto Gambar" : "Pilih File Gambar dari Perangkat"}</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Format didukung: JPG, PNG, WEBP (Maksimal 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Deskripsi Ruangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Ruangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Informasi kegunaan ruangan atau letak posisi..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* ========================================================
                  PILIHAN MULTI FASILITAS RUANGAN (1 Ruangan Banyak Fasilitas)
                  ======================================================== */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Fasilitas yang Tersedia di Ruangan Ini
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Centang fasilitas yang ada dan tentukan jumlah unitnya
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {Object.values(selectedFasilitas).filter((f) => f.selected).length} Dipilih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
                  {fasilitasList.map((fas) => {
                    const isChecked = selectedFasilitas[fas.id]?.selected || false;
                    const jumlah = selectedFasilitas[fas.id]?.jumlah || 1;

                    return (
                      <div
                        key={fas.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          isChecked
                            ? "bg-white border-indigo-300 shadow-2xs"
                            : "bg-white/60 border-slate-200/70 hover:bg-white"
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFasilitas(fas.id)}
                            className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {fas.nama}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Satuan: {fas.satuan || "Unit"}
                            </span>
                          </div>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={jumlah}
                              onChange={(e) =>
                                handleFasilitasJumlahChange(fas.id, Number(e.target.value))
                              }
                              className="w-14 p-1 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="statusAktifRuangan"
                  checked={formData.status_aktif}
                  onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="statusAktifRuangan" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Status Aktif (Tersedia untuk pengajuan peminjaman)
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
                  {editingRuangan ? "Simpan Perubahan Ruangan" : "Tambahkan Ruangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DETAIL LENGKAP FASILITAS & FOTO RUANGAN
          ======================================================== */}
      {viewDetailRuangan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Detail Ruangan & Fasilitas: <span className="text-indigo-600">{viewDetailRuangan.kode}</span>
                </h4>
              </div>
              <button
                onClick={() => setViewDetailRuangan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Foto Banner */}
              {viewDetailRuangan.url_foto ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-56">
                  <img
                    src={viewDetailRuangan.url_foto}
                    alt={viewDetailRuangan.kode}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-slate-400 italic">
                  Belum ada foto ruangan yang diunggah
                </div>
              )}

              {/* Rincian Ruangan */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gedung:</span>
                  <span className="font-bold text-slate-800">{viewDetailRuangan.gedung?.nama || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kapasitas Maksimal:</span>
                  <span className="font-bold text-indigo-600">{viewDetailRuangan.kapasitas} Orang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lantai & Luas:</span>
                  <span className="font-semibold text-slate-800">
                    Lantai {viewDetailRuangan.lantai || 1} ({viewDetailRuangan.luas_m2 || "-"} m²)
                  </span>
                </div>
                {viewDetailRuangan.deskripsi && (
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-0.5">Deskripsi:</span>
                    <span className="text-slate-700">{viewDetailRuangan.deskripsi}</span>
                  </div>
                )}
              </div>

              {/* Daftar Fasilitas Lengkap */}
              <div>
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Daftar Fasilitas di Ruangan Ini:
                </h5>
                {!viewDetailRuangan.ruangan_fasilitas || viewDetailRuangan.ruangan_fasilitas.length === 0 ? (
                  <p className="text-slate-400 italic">Tidak ada fasilitas terdaftar.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {viewDetailRuangan.ruangan_fasilitas.map((rf, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">
                          {rf.fasilitas?.nama || "Fasilitas"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white text-indigo-700 font-bold text-[11px] shadow-2xs">
                          {rf.jumlah} {rf.fasilitas?.satuan || "Unit"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailRuangan(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS RUANGAN
          ======================================================== */}
      {deleteConfirmRuangan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Konfirmasi Hapus Ruangan
                </h4>
                <p className="text-[11px] text-slate-500">Tindakan ini permanen</p>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data ruangan berikut beserta seluruh data fasilitas terkait?
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-800">{deleteConfirmRuangan.kode}</div>
                <div className="text-slate-500">
                  Gedung: {deleteConfirmRuangan.gedung?.nama || "-"}
                </div>
                <div className="text-slate-500">
                  Kapasitas: {deleteConfirmRuangan.kapasitas} Orang | Lantai: {deleteConfirmRuangan.lantai || 1}
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmRuangan(null)}
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
                <span>Ya, Hapus Ruangan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
