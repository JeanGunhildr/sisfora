"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  Calendar,
  Users,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RotateCw,
  Clock,
} from "lucide-react";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";

interface AjukanPeminjamanFormProps {
  userId: string;
  userNama: string;
  ruangans: Array<{
    id: string;
    kode: string;
    kapasitas: number;
    lantai: number;
    gedung?: any;
  }>;
  organisasis: Array<{
    id: string;
    nama: string;
    singkatan?: string | null;
  }>;
}

export default function AjukanPeminjamanForm({
  userId,
  userNama,
  ruangans,
  organisasis,
}: AjukanPeminjamanFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preselectedRoom = searchParams.get("ruangan") || (ruangans[0]?.id ?? "");

  const [ruanganId, setRuanganId] = useState<string>(preselectedRoom);
  const [jenisPeminjaman, setJenisPeminjaman] = useState<"umum" | "organisasi">("umum");
  const [organisasiId, setOrganisasiId] = useState<string>(organisasis[0]?.id ?? "");
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [deskripsiKegiatan, setDeskripsiKegiatan] = useState("");
  const [jumlahPeserta, setJumlahPeserta] = useState<number>(20);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  // Document upload state
  const [fileName, setFileName] = useState("");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileMime, setFileMime] = useState<string>("application/pdf");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Real-time checking for schedule conflict (First Come, First Served)
  React.useEffect(() => {
    if (!ruanganId || !tanggalMulai || !tanggalSelesai) {
      setConflictWarning(null);
      return;
    }

    const start = new Date(tanggalMulai);
    const end = new Date(tanggalSelesai);
    if (start >= end) {
      setConflictWarning("Waktu mulai harus lebih awal dari waktu selesai.");
      return;
    }

    let isMounted = true;
    async function checkOverlap() {
      setCheckingConflict(true);
      try {
        const { data: conflicts } = await supabase
          .from("pengajuan")
          .select("id, nomor_pengajuan, tanggal_mulai, tanggal_selesai")
          .eq("ruangan_id", ruanganId)
          .not("status", "in", '("ditolak_ketua","ditolak_wd3","dibatalkan","kedaluwarsa")')
          .lt("tanggal_mulai", end.toISOString())
          .gt("tanggal_selesai", start.toISOString());

        if (isMounted) {
          if (conflicts && conflicts.length > 0) {
            setConflictWarning(
              "⚠️ Jadwal ruangan pada jam tersebut telah diamankan oleh pemohon lain (First Come, First Served). Silakan pilih ruangan atau waktu lain."
            );
          } else {
            setConflictWarning(null);
          }
        }
      } catch {
        // Abaikan error saat pengecekan live
      } finally {
        if (isMounted) setCheckingConflict(false);
      }
    }

    const timer = setTimeout(checkOverlap, 350);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ruanganId, tanggalMulai, tanggalSelesai]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran file surat maksimal 10MB.");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setFileMime(file.type || "application/pdf");

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!ruanganId) {
      setErrorMsg("Silakan pilih ruangan yang ingin dipinjam.");
      return;
    }

    if (!namaKegiatan.trim()) {
      setErrorMsg("Nama kegiatan wajib diisi.");
      return;
    }

    if (!tanggalMulai || !tanggalSelesai) {
      setErrorMsg("Tanggal mulai dan tanggal selesai wajib ditentukan.");
      return;
    }

    if (new Date(tanggalMulai) >= new Date(tanggalSelesai)) {
      setErrorMsg("Tanggal mulai tidak boleh lebih lambat atau sama dengan tanggal selesai.");
      return;
    }

    if (!fileBase64) {
      setErrorMsg("Wajib mengunggah berkas surat permohonan peminjaman.");
      return;
    }

    setLoading(true);

    try {
      // 1. Generate nomor pengajuan unik
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const prefix = jenisPeminjaman === "organisasi" ? "ORG" : "UMUM";
      const nomorPengajuan = `PJ-${prefix}-${new Date().getFullYear()}-${randomCode}`;

      // 2. Tentukan status awal sesuai alur workflow:
      // - Kategori Umum: langsung 'menunggu_wd3' setelah upload
      // - Kategori Organisasi: masuk 'menunggu_ketua' untuk diverifikasi ketua organisasi dahulu
      const initialStatus = jenisPeminjaman === "organisasi" ? "menunggu_ketua" : "menunggu_wd3";

      // 3. Insert ke tabel pengajuan
      const { data: insertedPengajuan, error: pError } = await supabase
        .from("pengajuan")
        .insert({
          nomor_pengajuan: nomorPengajuan,
          pemohon_id: userId,
          ruangan_id: ruanganId,
          jenis_peminjaman: jenisPeminjaman,
          organisasi_id: jenisPeminjaman === "organisasi" ? organisasiId : null,
          nama_kegiatan: namaKegiatan.trim(),
          deskripsi_kegiatan: deskripsiKegiatan.trim() || null,
          jumlah_peserta: jumlahPeserta,
          tanggal_mulai: new Date(tanggalMulai).toISOString(),
          tanggal_selesai: new Date(tanggalSelesai).toISOString(),
          status: initialStatus,
        })
        .select()
        .single();

      if (pError) {
        if (
          pError.code === "23P01" ||
          pError.message?.includes("First Come, First Served") ||
          pError.message?.includes("bentrok") ||
          pError.message?.includes("no_overlapping_ruangan_schedule")
        ) {
          throw new Error(
            "Jadwal ruangan yang Anda pilih telah diamankan oleh pemohon lain terlebih dahulu (First Come, First Served). Silakan pilih ruangan lain atau tentukan waktu yang berbeda."
          );
        }
        throw pError;
      }

      // 4. Insert dokumen surat permohonan ke dokumen_pengajuan
      const { error: dError } = await supabase.from("dokumen_pengajuan").insert({
        pengajuan_id: insertedPengajuan.id,
        url_file: fileBase64,
        nama_file: fileName || "surat_permohonan.pdf",
        mime_type: fileMime,
        ukuran_byte: fileSize,
        status_dokumen: "diunggah",
        diunggah_oleh: userId,
      });

      if (dError) throw dError;

      // 5. Catat riwayat status awal
      await supabase.from("riwayat_status").insert({
        pengajuan_id: insertedPengajuan.id,
        status_sebelumnya: "menunggu_upload",
        status_baru: initialStatus,
        aktor_id: userId,
        catatan:
          jenisPeminjaman === "organisasi"
            ? "Pengajuan organisasi dibuat dan diteruskan ke Ketua Organisasi untuk tanda tangan."
            : "Pengajuan umum dibuat dan diteruskan ke Wakil Dekan 3 untuk persetujuan.",
      });

      setSuccessMsg(`Permohonan ${nomorPengajuan} berhasil diajukan! Jadwal ruangan berhasil diamankan.`);
      setTimeout(() => {
        router.push("/dashboard/mahasiswa/peminjaman");
      }, 1500);
    } catch (err: any) {
      console.error("Gagal membuat pengajuan:", err);
      setErrorMsg(err.message || "Gagal membuat pengajuan peminjaman.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/mahasiswa/ruangan"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Ruangan</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Formulir Pengajuan Peminjaman Ruangan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Lengkapi data kegiatan dan unggah surat permohonan resmi untuk diverifikasi.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Kategori Peminjaman */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kategori Peminjaman:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJenisPeminjaman("umum")}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  jenisPeminjaman === "umum"
                    ? "bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/10"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-xs">Peminjaman Umum / Mahasiswa</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Langsung diverifikasi &amp; disahkan oleh Wakil Dekan 3
                </div>
              </button>

              <button
                type="button"
                onClick={() => setJenisPeminjaman("organisasi")}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  jenisPeminjaman === "organisasi"
                    ? "bg-violet-50 border-violet-300 text-violet-900 ring-2 ring-violet-500/10"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-xs">Peminjaman Organisasi (BEM / HIMA / UKM)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Wajib diverifikasi Ketua Organisasi terlebih dahulu sebelum ke WD3
                </div>
              </button>
            </div>
          </div>

          {/* Organisasi Selector jika jenis organisasi */}
          {jenisPeminjaman === "organisasi" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Organisasi Penyelenggara:
              </label>
              <div className="w-full">
                <CustomSelect
                  value={organisasiId}
                  onChange={(val) => setOrganisasiId(val)}
                  options={organisasis.map((org) => ({
                    value: org.id,
                    label: `${org.nama} (${org.singkatan || "-"})`,
                  }))}
                />
              </div>
            </div>
          )}

          {/* Pilih Ruangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Ruangan:
            </label>
            <div className="w-full">
              <CustomSelect
                value={ruanganId}
                onChange={(val) => setRuanganId(val)}
                options={ruangans.map((r) => {
                  const gName = Array.isArray(r.gedung) ? r.gedung[0]?.nama : r.gedung?.nama;
                  return {
                    value: r.id,
                    label: `Ruang ${r.kode} — ${gName || "Gedung"} (Lt. ${r.lantai}, Kapasitas ${r.kapasitas} org)`,
                  };
                })}
              />
            </div>
          </div>

          {/* Nama & Deskripsi Kegiatan */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama / Tajuk Kegiatan:
              </label>
              <input
                type="text"
                required
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Seminar Nasional AI & Workshop Mahasiswa 2026"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Deskripsi / Keperluan Kegiatan:
              </label>
              <textarea
                rows={3}
                value={deskripsiKegiatan}
                onChange={(e) => setDeskripsiKegiatan(e.target.value)}
                placeholder="Jelaskan secara ringkas maksud penggunaan ruangan dan agenda acara..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Jadwal & Peserta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Mulai:
              </label>
              <input
                type="datetime-local"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Selesai:
              </label>
              <input
                type="datetime-local"
                required
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimasi Peserta (Orang):
              </label>
              <input
                type="number"
                min={1}
                required
                value={jumlahPeserta}
                onChange={(e) => setJumlahPeserta(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Schedule Conflict Warning */}
          {conflictWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <div className="flex-1">
                <span className="font-semibold">{conflictWarning}</span>
                <span className="block text-[11px] text-amber-600 mt-0.5">
                  Sistem beroperasi berdasarkan siapa cepat dia dapat. Slot hanya dapat diajukan jika jadwal kosong atau pengajuan sebelumnya telah ditolak/dibatalkan.
                </span>
              </div>
            </div>
          )}

          {/* FCFS Information Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Aturan First Come, First Served:</strong> Jadwal ruangan langsung terkunci di database saat pengajuan ini terkirim. Jika pengajuan ditolak atau dibatalkan, jadwal otomatis terbuka kembali.
            </span>
          </div>

          {/* Upload Surat Permohonan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Unggah Dokumen Surat Permohonan (PDF):
            </label>
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              {fileName ? (
                <div>
                  <p className="text-xs font-bold text-slate-800">{fileName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(fileSize / 1024).toFixed(1)} KB • Siap diunggah
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700">Pilih berkas surat permohonan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Format PDF (maksimal 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/dashboard/mahasiswa/ruangan"
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{loading ? "Mengirim Pengajuan..." : "Kirim Permohonan Peminjaman"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
