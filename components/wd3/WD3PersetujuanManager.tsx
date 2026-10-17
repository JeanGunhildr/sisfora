"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileCheck2,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Users,
  Download,
  Eye,
  FileText,
  RotateCw,
  Award,
  Crown,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomSelect, { OptionItem } from "@/components/ui/CustomSelect";

export interface PengajuanWD3Item {
  id: string;
  nomor_pengajuan: string;
  pemohon_id: string;
  ruangan_id: string;
  jenis_peminjaman: "umum" | "organisasi";
  organisasi_id?: string | null;
  nama_kegiatan: string;
  deskripsi_kegiatan?: string | null;
  jumlah_peserta: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  alasan_penolakan?: string | null;
  diproses_oleh?: string | null;
  diputuskan_pada?: string | null;
  updated_at?: string;
  created_at: string;
  pemohon?: {
    id: string;
    nama: string;
    nim?: string | null;
    email: string;
  };
  ruangan?: {
    id: string;
    kode: string;
    kapasitas: number;
    gedung?: {
      id?: string;
      nama: string;
    };
  };
  organisasi?: {
    id: string;
    nama: string;
    singkatan?: string | null;
    ketua?: {
      id?: string;
      nama: string;
    };
  };
  dokumen_pengajuan?: Array<{
    id: string;
    url_file: string;
    nama_file: string;
    status_dokumen: string;
    updated_at: string;
  }>;
}

interface WD3PersetujuanManagerProps {
  wd3Id: string;
  wd3Nama: string;
}

import { getRelevantDokumen } from "@/lib/wd3";
export { getRelevantDokumen };

export default function WD3PersetujuanManager({ wd3Id, wd3Nama }: WD3PersetujuanManagerProps) {
  const supabase = createClient();

  const [pengajuans, setPengajuans] = useState<PengajuanWD3Item[]>([]);
  const [totalFetched, setTotalFetched] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState<"semua" | "umum" | "organisasi">("semua");
  const [actionLoading, setActionLoading] = useState(false);

  // Diagnostic Error State
  const [queryError, setQueryError] = useState<{
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null>(null);

  // Modal Sign & Approve State
  const [signingItem, setSigningItem] = useState<PengajuanWD3Item | null>(null);
  const [signatureMode, setSignatureMode] = useState<"draw" | "stamp">("draw");
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(null);

  // Canvas ref for drawing signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Modal Reject State
  const [rejectItem, setRejectItem] = useState<PengajuanWD3Item | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchPengajuanForWD3 = async () => {
    setLoading(true);
    setQueryError(null);

    try {
      // Query dengan sintaks foreign key eksplisit untuk mencegah ambiguitas relasi PostgREST (PGRST201)
      const { data, error } = await supabase
        .from("pengajuan")
        .select(`
          *,
          pemohon:users!pengajuan_pemohon_id_fkey (
            id,
            nama,
            nim,
            email
          ),
          ruangan:ruangan!pengajuan_ruangan_id_fkey (
            id,
            kode,
            kapasitas,
            gedung:gedung!ruangan_gedung_id_fkey (
              id,
              nama
            )
          ),
          organisasi:organisasi!pengajuan_organisasi_id_fkey (
            id,
            nama,
            singkatan,
            ketua:users!organisasi_ketua_id_fkey (
              id,
              nama
            )
          ),
          dokumen_pengajuan:dokumen_pengajuan!dokumen_pengajuan_pengajuan_id_fkey (
            id,
            url_file,
            nama_file,
            status_dokumen,
            updated_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal mengambil data pengajuan WD3 dari Supabase:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setQueryError({
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setPengajuans([]);
        return;
      }

      const allList: PengajuanWD3Item[] = (data as any) || [];
      setTotalFetched(allList.length);

      // ==============================================================================
      // BUSINESS WORKFLOW RULES:
      // A. Peminjaman UMUM:
      //    - Harus sudah memiliki dokumen terunggah (tidak boleh 'menunggu_upload')
      //    - Status pengajuan adalah 'menunggu_wd3' (langsung masuk ke antrean WD3)
      //
      // B. Peminjaman ORGANISASI:
      //    - Harus menunggu sampai Ketua Organisasi menandatangani surat:
      //      status_dokumen === 'ditandatangani_ketua' AND status_pengajuan === 'menunggu_wd3'
      //    - TIDAK boleh tampil jika masih 'menunggu_upload' atau 'menunggu_ketua'
      //
      // C. Selesai / Decided:
      //    - 'disetujui', 'ditolak_wd3', 'ditolak_ketua', 'dibatalkan', 'kedaluwarsa'
      //      dikeluarkan dari antrean
      // ==============================================================================
      const pendingForWD3 = allList.filter((item) => {
        // Keluarkan permohonan yang sudah diputuskan
        if (
          item.status === "disetujui" ||
          item.status === "ditolak_wd3" ||
          item.status === "ditolak_ketua" ||
          item.status === "dibatalkan" ||
          item.status === "kedaluwarsa"
        ) {
          return false;
        }

        // Harus memiliki dokumen surat terkait
        const doc = getRelevantDokumen(item);
        if (!doc) {
          return false;
        }

        // Jangan tampilkan jika masih dalam tahap menunggu upload dokumen
        if (item.status === "menunggu_upload") {
          return false;
        }

        const isOrganisasi =
          item.jenis_peminjaman === "organisasi" || Boolean(item.organisasi_id);

        if (isOrganisasi) {
          // Kategori Organisasi: HANYA jika dokumen sudah bertanda tangan Ketua Organisasi
          // dan status peminjaman telah diteruskan ke WD3 ('menunggu_wd3')
          const isSignedByKetua = doc.status_dokumen === "ditandatangani_ketua";
          return isSignedByKetua && item.status === "menunggu_wd3";
        }

        // Kategori Umum: Langsung masuk ke antrean WD3 ketika status 'menunggu_wd3' atau dokumen 'diunggah'
        return item.status === "menunggu_wd3" || doc.status_dokumen === "diunggah";
      });

      setPengajuans(pendingForWD3);
    } catch (err: any) {
      console.error("Terjadi exception pada fetchPengajuanForWD3:", err);
      setQueryError({
        message: err.message || "Terjadi kesalahan internal saat memuat data.",
      });
      setPengajuans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengajuanForWD3();
  }, []);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b"; // deep indigo ink color
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignatureData(null);
  };

  // Generate Official Stamp Image (for visual seal certificate preview)
  const generateOfficialStamp = (nomorPengajuan: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#1e3a8a"; // deep blue
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 380, 180);

    // Inner subtle border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 368, 168);

    // Header Stamp
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FAKULTAS - WAKIL DEKAN III", 200, 42);

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#047857"; // emerald green verified
    ctx.fillText("✓ PENGESAHAN TANDA TANGAN DIGITAL", 200, 64);

    // Nomor & Tanggal
    ctx.font = "10px monospace";
    ctx.fillStyle = "#475569";
    ctx.fillText(`No: ${nomorPengajuan}`, 200, 92);
    ctx.fillText(
      `Tanggal: ${new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      200,
      112
    );

    // Penandatangan
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(wd3Nama || "Wakil Dekan 3", 200, 142);

    ctx.font = "9px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Dokumen Terverifikasi & Sah Secara Sistem SISFORA", 200, 162);

    return canvas.toDataURL("image/png");
  };

  // ==============================================================================
  // HANDLE PERSETUJUAN & PENGESAHAN DOKUMEN OLEH WD3
  // ==============================================================================
  const handleApproveAndSign = async () => {
    if (!signingItem) return;

    // Cari dokumen relevan
    const targetDoc = getRelevantDokumen(signingItem);
    if (!targetDoc) {
      showFeedback("error", "Dokumen surat permohonan tidak ditemukan pada pengajuan ini.");
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const verificationRef = `WD3-ACC-${signingItem.nomor_pengajuan}-${Date.now()}`;
      const docHash = `SHA256-${signingItem.id.replace(/-/g, "").slice(0, 16).toUpperCase()}-${Date.now()}`;

      // 1. UPDATE DOKUMEN: Tandai status dokumen telah ditandatangani WD3
      // PERHATIKAN: URL file asli PDF TETAP dipertahankan, tidak ditimpa string base64 PNG canvas
      const { error: docError } = await supabase
        .from("dokumen_pengajuan")
        .update({
          status_dokumen: "ditandatangani_wd3",
          updated_at: now,
        })
        .eq("id", targetDoc.id);

      if (docError) {
        console.error("Gagal update dokumen_pengajuan:", docError);
        throw new Error(`Gagal memperbarui status dokumen: ${docError.message}`);
      }

      // 2. UPDATE STATUS PENGAJUAN: Setujui permohonan
      const { error: pError } = await supabase
        .from("pengajuan")
        .update({
          status: "disetujui",
          diproses_oleh: wd3Id,
          diputuskan_pada: now,
          updated_at: now,
        })
        .eq("id", signingItem.id);

      if (pError) {
        console.error("Gagal update pengajuan disetujui:", pError);
        throw new Error(`Gagal memperbarui status pengajuan: ${pError.message}`);
      }

      // 3. CATAT LOG TANDA TANGAN RESMI
      // Menggunakan tahap = 'wd3' dan status = 'berhasil' (sesuai enum DB)
      const { error: ttdError } = await supabase.from("tanda_tangan").insert({
        pengajuan_id: signingItem.id,
        dokumen_id: targetDoc.id,
        penanda_tangan_id: wd3Id,
        tahap: "wd3",
        status: "berhasil",
        waktu_tanda_tangan: now,
        metode: signatureMode === "draw" ? "canvas_signature" : "digital_stamp",
        referensi_verifikasi: verificationRef,
        hash_dokumen: docHash,
      });

      if (ttdError) {
        console.warn("Peringatan log tanda tangan:", ttdError);
      }

      // 4. CATAT RIWAYAT STATUS
      // Gunakan status_sebelumnya aktual dari signingItem.status
      const { error: riwayatError } = await supabase.from("riwayat_status").insert({
        pengajuan_id: signingItem.id,
        status_sebelumnya: signingItem.status,
        status_baru: "disetujui",
        aktor_id: wd3Id,
        catatan: `Disetujui dan disahkan secara resmi oleh Wakil Dekan 3 (${wd3Nama}). Referensi: ${verificationRef}`,
      });

      if (riwayatError) {
        console.warn("Peringatan log riwayat status:", riwayatError);
      }

      showFeedback(
        "success",
        `Permohonan "${signingItem.nama_kegiatan}" (${signingItem.nomor_pengajuan}) berhasil disetujui & disahkan dengan tanda tangan digital resmi.`
      );

      setSigningItem(null);
      setDrawnSignatureData(null);
      await fetchPengajuanForWD3();
    } catch (err: any) {
      console.error("Gagal proses persetujuan:", err);
      showFeedback("error", err.message || "Gagal menyetujui surat permohonan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================================
  // HANDLE PENOLAKAN PERMOHONAN OLEH WD3
  // ==============================================================================
  const handleConfirmReject = async () => {
    if (!rejectItem) return;
    setActionLoading(true);

    try {
      const now = new Date().toISOString();
      const reason =
        rejectReason.trim() ||
        "Tidak memenuhi persyaratan administrasi penggunaan fasilitas fakultas.";

      // 1. UPDATE STATUS PENGAJUAN: Gunakan status 'ditolak_wd3' (sesuai enum DB)
      const { error: pError } = await supabase
        .from("pengajuan")
        .update({
          status: "ditolak_wd3",
          alasan_penolakan: reason,
          diproses_oleh: wd3Id,
          diputuskan_pada: now,
          updated_at: now,
        })
        .eq("id", rejectItem.id);

      if (pError) {
        console.error("Gagal menolak pengajuan:", pError);
        throw new Error(`Gagal memperbarui status penolakan: ${pError.message}`);
      }

      // 2. CATAT KE RIWAYAT STATUS: Catat status sebelumnya aktual
      const { error: rError } = await supabase.from("riwayat_status").insert({
        pengajuan_id: rejectItem.id,
        status_sebelumnya: rejectItem.status,
        status_baru: "ditolak_wd3",
        aktor_id: wd3Id,
        catatan: `Ditolak oleh Wakil Dekan 3 (${wd3Nama}). Alasan: ${reason}`,
      });

      if (rError) {
        console.warn("Peringatan log riwayat penolakan:", rError);
      }

      showFeedback(
        "success",
        `Permohonan "${rejectItem.nama_kegiatan}" telah ditolak dengan catatan alasan.`
      );
      setRejectItem(null);
      setRejectReason("");
      await fetchPengajuanForWD3();
    } catch (err: any) {
      console.error("Gagal menolak permohonan:", err);
      showFeedback("error", err.message || "Gagal menolak permohonan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const filteredList = pengajuans.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.nomor_pengajuan.toLowerCase().includes(q) ||
      item.nama_kegiatan.toLowerCase().includes(q) ||
      (item.pemohon?.nama && item.pemohon.nama.toLowerCase().includes(q)) ||
      (item.pemohon?.nim && item.pemohon.nim.toLowerCase().includes(q)) ||
      (item.ruangan?.kode && item.ruangan.kode.toLowerCase().includes(q));

    const matchJenis = filterJenis === "semua" || item.jenis_peminjaman === filterJenis;

    return matchSearch && matchJenis;
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
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="flex-1">{feedback.msg}</span>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Diagnostic Query Error Banner */}
      {queryError && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Gagal Memuat Antrean Pengajuan (Query Error)</span>
            </div>
            <button
              onClick={fetchPengajuanForWD3}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
          <p className="text-xs text-rose-700">{queryError.message}</p>
          {(queryError.code || queryError.hint) && (
            <div className="text-[11px] font-mono bg-white/80 p-2.5 rounded-xl border border-rose-100 text-rose-900 space-y-0.5">
              {queryError.code && <div>Kode Error: {queryError.code}</div>}
              {queryError.hint && <div>Petunjuk: {queryError.hint}</div>}
              {queryError.details && <div>Rincian: {queryError.details}</div>}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor surat, kegiatan, nama pemohon, atau ruangan..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Filter Jenis & Refresh Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="w-44">
            <CustomSelect
              value={filterJenis}
              onChange={(val) => setFilterJenis(val as any)}
              options={[
                { value: "semua", label: "Semua Kategori" },
                { value: "umum", label: "Kategori Umum" },
                { value: "organisasi", label: "Kategori Organisasi" },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={fetchPengajuanForWD3}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Muat Ulang Antrean"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Antrean Surat Menunggu Tanda Tangan WD3
              </h2>
              <p className="text-xs text-slate-500">
                Surat peminjaman umum dan permohonan organisasi yang telah disahkan oleh Ketua Organisasi
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {pengajuans.length} Menunggu Persetujuan
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs font-medium">Memuat antrean pengajuan...</p>
          </div>
        ) : queryError ? (
          <div className="p-12 text-center text-xs text-rose-500">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <p className="font-semibold text-rose-800 text-sm">Gagal menampilkan antrean</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Periksa log konsol browser atau klik tombol coba lagi di atas.
            </p>
          </div>
        ) : totalFetched === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Permohonan di Sistem
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Belum ada data permohonan peminjaman ruangan yang tercatat di database saat ini.
            </p>
          </div>
        ) : pengajuans.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Tidak Ada Permohonan Siap Tanda Tangan
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Semua surat yang memenuhi syarat telah selesai ditinjau. Permohonan kategori organisasi yang baru diajukan harus ditandatangani terlebih dahulu oleh Ketua Organisasi masing-masing sebelum masuk ke antrean ini.
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">Tidak ada hasil yang cocok</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada permohonan yang sesuai dengan filter atau kata kunci "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Pengajuan &amp; Kegiatan</th>
                  <th className="py-3.5 px-6">Pemohon</th>
                  <th className="py-3.5 px-6">Ruangan / Jadwal</th>
                  <th className="py-3.5 px-6 text-center">Kategori</th>
                  <th className="py-3.5 px-6 text-center">Status Dokumen</th>
                  <th className="py-3.5 px-6 text-right">Aksi Persetujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((p) => {
                  const doc = getRelevantDokumen(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nomor & Kegiatan */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-mono text-[11px] text-indigo-600 font-bold">
                          {p.nomor_pengajuan}
                        </div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 truncate">
                          {p.nama_kegiatan}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {p.jumlah_peserta} Orang • Diajukan:{" "}
                          {new Date(p.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Pemohon */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{p.pemohon?.nama}</div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          {p.pemohon?.nim || "-"}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[160px]">
                          {p.pemohon?.email}
                        </div>
                      </td>

                      {/* Ruangan & Tanggal */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Ruang {p.ruangan?.kode || "-"}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {p.ruangan?.gedung?.nama || "Gedung Fakultas"}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(p.tanggal_mulai).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            -{" "}
                            {new Date(p.tanggal_selesai).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-4 px-6 text-center">
                        {p.jenis_peminjaman === "organisasi" ? (
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              Organisasi
                            </span>
                            {p.organisasi?.singkatan && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {p.organisasi.singkatan}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Umum
                          </span>
                        )}
                      </td>

                      {/* Status Dokumen Surat */}
                      <td className="py-4 px-6 text-center">
                        {doc ? (
                          <div className="flex flex-col items-center gap-1">
                            {doc.status_dokumen === "ditandatangani_ketua" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Crown className="w-3 h-3" />
                                <span>TTD Ketua Org</span>
                              </span>
                            ) : doc.status_dokumen === "ditandatangani_wd3" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>TTD WD3</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                <FileText className="w-3 h-3" />
                                <span>Diunggah</span>
                              </span>
                            )}

                            {doc.url_file && (
                              <a
                                href={doc.url_file}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold mt-0.5"
                              >
                                <span>Lihat Surat Asli</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Tanpa Dokumen
                          </span>
                        )}
                      </td>

                      {/* Aksi Persetujuan */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSigningItem(p);
                              setSignatureMode("draw");
                              setDrawnSignatureData(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs text-xs cursor-pointer active:scale-95"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Tanda Tangan &amp; ACC</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectItem(p);
                              setRejectReason("");
                            }}
                            className="p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                            title="Tolak Permohonan"
                          >
                            <XCircle className="w-4 h-4" />
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
          MODAL: TANDA TANGAN DIGITAL & PERSETUJUAN DOKUMEN
          ======================================================== */}
      {signingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Persetujuan &amp; Tanda Tangan Digital WD3
                  </h4>
                  <span className="font-mono text-xs text-indigo-600 font-semibold">
                    {signingItem.nomor_pengajuan}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSigningItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview */}
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {signingItem.nama_kegiatan}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-white border border-slate-200 text-slate-700">
                    {signingItem.jenis_peminjaman}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div>
                    Pemohon: <strong className="text-slate-700">{signingItem.pemohon?.nama}</strong>
                  </div>
                  <div>
                    Ruangan: <strong className="text-slate-700">{signingItem.ruangan?.kode}</strong>
                  </div>
                </div>

                {/* Dokumen Surat Tautan */}
                {(() => {
                  const doc = getRelevantDokumen(signingItem);
                  return doc ? (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Berkas Surat Permohonan:</span>
                      <a
                        href={doc.url_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Buka Dokumen PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Signature Mode Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Metode Pengesahan Tanda Tangan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      signatureMode === "draw"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        signatureMode === "draw"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      ✍
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Goresan Langsung</div>
                      <div className="text-[10px] text-slate-400">Canvas tanda tangan digital</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignatureMode("stamp")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      signatureMode === "stamp"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        signatureMode === "stamp"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Stempel &amp; Sertifikat</div>
                      <div className="text-[10px] text-slate-400">Pengesahan resmi WD3</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode 1: Canvas Drawing */}
              {signatureMode === "draw" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Bubuhkan tanda tangan Anda pada area di bawah:</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Bersihkan Canvas
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-indigo-200 rounded-3xl overflow-hidden bg-slate-50 p-1 flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="bg-white rounded-2xl cursor-crosshair touch-none w-full max-w-[480px] h-[160px]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Gunakan kursor mouse atau sentuhan jari/stylus pada layar untuk menandatangani.
                  </p>
                </div>
              )}

              {/* Mode 2: Official Stamp Preview */}
              {signatureMode === "stamp" && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">
                    Pratinjau Stempel Digital Resmi yang akan dibubuhkan:
                  </div>
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
                      Fakultas - Wakil Dekan III (Bidang Kemahasiswaan)
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700">
                      ✓ PENGESAHAN TANDA TANGAN DIGITAL TERVERIFIKASI
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      No. Pengajuan: {signingItem.nomor_pengajuan}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Penandatangan: {wd3Nama} • Tanggal:{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Informasi Efisiensi Dokumen */}
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Catatan Pengesahan:</strong> Dokumen surat permohonan akan diperbarui statusnya menjadi <em>ditandatangani_wd3</em> dan nomor sertifikasi digital akan dicatat di buku riwayat persetujuan resmi.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSigningItem(null)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApproveAndSign}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{actionLoading ? "Memproses..." : "Setujui & Sahkan Surat"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TOLAK PERMOHONAN OLEH WD3
          ======================================================== */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Tolak Permohonan Peminjaman
                </h4>
              </div>
              <button
                onClick={() => setRejectItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menolak surat permohonan untuk kegiatan:{" "}
                <strong className="text-slate-800">{rejectItem.nama_kegiatan}</strong> diajukan oleh{" "}
                <strong className="text-slate-800">{rejectItem.pemohon?.nama}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alasan Penolakan (Akan Dibaca Pemohon)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Jadwal bertabrakan dengan agenda resmi fakultas atau persyaratan belum lengkap."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Konfirmasi Penolakan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
