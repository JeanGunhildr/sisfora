"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PenTool,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Users,
  FileText,
  RotateCw,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";

interface KetuaTandaTanganViewProps {
  ketuaId: string;
  ketuaNama: string;
}

export default function KetuaTandaTanganView({ ketuaId, ketuaNama }: KetuaTandaTanganViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const id = searchParams.get("id");

  const [pengajuan, setPengajuan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Signature state
  const [signatureMode, setSignatureMode] = useState<"draw" | "stamp">("draw");
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchDetail = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pengajuan")
        .select(`
          *,
          pemohon:users!pengajuan_pemohon_id_fkey (id, nama, nim, email),
          ruangan:ruangan!pengajuan_ruangan_id_fkey (
            id,
            kode,
            kapasitas,
            gedung:gedung!ruangan_gedung_id_fkey (id, nama)
          ),
          organisasi:organisasi!pengajuan_organisasi_id_fkey (id, nama, singkatan),
          dokumen_pengajuan:dokumen_pengajuan!dokumen_pengajuan_pengajuan_id_fkey (
            id,
            url_file,
            nama_file,
            status_dokumen,
            updated_at
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setPengajuan(data);
    } catch (err: any) {
      console.error("Gagal memuat detail pengajuan:", err);
      showToast("error", err.message || "Gagal memuat pengajuan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Canvas Handlers
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
    ctx.strokeStyle = "#4338ca"; // indigo-700
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

  // Handle Approve & Sign by Ketua Organisasi
  const handleApprove = async () => {
    if (!pengajuan) return;

    const doc = pengajuan.dokumen_pengajuan?.[0];
    if (!doc) {
      showToast("error", "Dokumen surat permohonan tidak ditemukan.");
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const verificationRef = `KETUA-${pengajuan.nomor_pengajuan}-${Date.now()}`;
      const docHash = `SHA256-${pengajuan.id.replace(/-/g, "").slice(0, 16).toUpperCase()}-${Date.now()}`;

      // 1. Update status dokumen menjadi 'ditandatangani_ketua'
      const { error: docError } = await supabase
        .from("dokumen_pengajuan")
        .update({
          status_dokumen: "ditandatangani_ketua",
          updated_at: now,
        })
        .eq("id", doc.id);

      if (docError) throw docError;

      // 2. Teruskan status pengajuan ke 'menunggu_wd3'
      const { error: pError } = await supabase
        .from("pengajuan")
        .update({
          status: "menunggu_wd3",
          updated_at: now,
        })
        .eq("id", pengajuan.id);

      if (pError) throw pError;

      // 3. Catat log tanda tangan ketua organisasi
      await supabase.from("tanda_tangan").insert({
        pengajuan_id: pengajuan.id,
        dokumen_id: doc.id,
        penanda_tangan_id: ketuaId,
        tahap: "ketua_organisasi",
        status: "berhasil",
        waktu_tanda_tangan: now,
        metode: signatureMode === "draw" ? "canvas_signature" : "digital_stamp",
        referensi_verifikasi: verificationRef,
        hash_dokumen: docHash,
      });

      // 4. Catat riwayat status
      await supabase.from("riwayat_status").insert({
        pengajuan_id: pengajuan.id,
        status_sebelumnya: pengajuan.status || "menunggu_ketua",
        status_baru: "menunggu_wd3",
        aktor_id: ketuaId,
        catatan: `Disetujui dan ditandatangani oleh Ketua Organisasi (${ketuaNama}). Diteruskan ke Wakil Dekan 3.`,
      });

      showToast("success", "Surat berhasil ditandatangani dan diteruskan ke antrean Wakil Dekan 3.");
      setTimeout(() => {
        router.push("/dashboard/ketua-organisasi");
      }, 1500);
    } catch (err: any) {
      console.error("Gagal menandatangani surat:", err);
      showToast("error", err.message || "Gagal menandatangani surat.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject by Ketua Organisasi
  const handleReject = async () => {
    if (!pengajuan) return;
    setActionLoading(true);

    try {
      const now = new Date().toISOString();
      const reason = rejectReason.trim() || "Tidak memenuhi ketentuan internal organisasi.";

      const { error: pError } = await supabase
        .from("pengajuan")
        .update({
          status: "ditolak_ketua",
          alasan_penolakan: reason,
          updated_at: now,
        })
        .eq("id", pengajuan.id);

      if (pError) throw pError;

      await supabase.from("riwayat_status").insert({
        pengajuan_id: pengajuan.id,
        status_sebelumnya: pengajuan.status || "menunggu_ketua",
        status_baru: "ditolak_ketua",
        aktor_id: ketuaId,
        catatan: `Ditolak oleh Ketua Organisasi (${ketuaNama}). Alasan: ${reason}`,
      });

      showToast("success", "Permohonan telah ditolak.");
      setShowRejectModal(false);
      setTimeout(() => {
        router.push("/dashboard/ketua-organisasi");
      }, 1500);
    } catch (err: any) {
      console.error("Gagal menolak:", err);
      showToast("error", err.message || "Gagal menolak permohonan.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-2">
        <RotateCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-xs font-medium">Memuat data pengajuan...</p>
      </div>
    );
  }

  if (!pengajuan) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-100">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800">Pengajuan Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-1">
          ID pengajuan tidak valid atau Anda tidak memiliki akses ke pengajuan ini.
        </p>
        <Link
          href="/dashboard/ketua-organisasi"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    );
  }

  const doc = pengajuan.dokumen_pengajuan?.[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/ketua-organisasi"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pengajuan</span>
        </Link>
        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          {pengajuan.nomor_pengajuan}
        </span>
      </div>

      {/* Proposal Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
            {pengajuan.organisasi?.nama || "Proposal Organisasi"}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            {pengajuan.nama_kegiatan}
          </h2>
          {pengajuan.deskripsi_kegiatan && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {pengajuan.deskripsi_kegiatan}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pemohon</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{pengajuan.pemohon?.nama}</span>
            <span className="text-[11px] text-slate-400 font-mono">{pengajuan.pemohon?.nim}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ruangan</span>
            <span className="font-bold text-slate-800 mt-0.5 block">Ruang {pengajuan.ruangan?.kode}</span>
            <span className="text-[11px] text-slate-400">{pengajuan.ruangan?.gedung?.nama}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Jadwal</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {new Date(pengajuan.tanggal_mulai).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-[11px] text-slate-400">{pengajuan.jumlah_peserta} Orang</span>
          </div>
        </div>

        {/* Document Attachment Link */}
        {doc ? (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="font-bold text-indigo-950 block">Dokumen Surat Permohonan</span>
                <span className="text-[11px] text-indigo-600">{doc.nama_file || "surat_permohonan.pdf"}</span>
              </div>
            </div>

            <a
              href={doc.url_file}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <span>Tinjau Dokumen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Peringatan: Pengajuan ini belum melampirkan berkas surat permohonan.
          </div>
        )}
      </div>

      {/* Signing Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800">
          Bubuhkan Tanda Tangan Digital Ketua Organisasi
        </h3>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSignatureMode("draw")}
            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
              signatureMode === "draw"
                ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="text-xs font-bold">✍ Goresan Langsung</div>
            <div className="text-[10px] text-slate-400">Canvas tanda tangan digital</div>
          </button>

          <button
            type="button"
            onClick={() => setSignatureMode("stamp")}
            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
              signatureMode === "stamp"
                ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="text-xs font-bold">🛡 Stempel Resmi Organisasi</div>
            <div className="text-[10px] text-slate-400">Sertifikat verifikasi otomatis</div>
          </button>
        </div>

        {/* Draw Canvas */}
        {signatureMode === "draw" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tanda tangan di dalam kotak:</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Bersihkan
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
          </div>
        )}

        {/* Stamp Preview */}
        {signatureMode === "stamp" && (
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <ShieldCheck className="w-8 h-8 text-indigo-600 mx-auto" />
            <div className="font-extrabold text-xs text-indigo-950 uppercase">
              {pengajuan.organisasi?.nama || "Lembaga Kemahasiswaan"}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700">
              ✓ TERVERIFIKASI &amp; DITANDATANGANI KETUA ORGANISASI
            </div>
            <div className="text-[10px] text-slate-500">
              Nama Ketua: {ketuaNama} • Tanggal: {new Date().toLocaleDateString("id-ID")}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
          >
            Tolak Permohonan
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleApprove}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {actionLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Setujui &amp; Teruskan ke Wakil Dekan 3</span>
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-rose-600 font-bold">
              <span>Tolak Pengajuan Organisasi</span>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Berikan catatan alasan mengapa permohonan ini ditolak:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Agenda bertabrakan dengan program kerja utama organisasi."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:bg-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 text-white"
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
