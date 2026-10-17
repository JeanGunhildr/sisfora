"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  Send,
  Building2,
  Clock,
  Calendar,
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  FileCheck,
  ShieldCheck,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RoomOption {
  id: string;
  gedung_id: string;
  kode: string;
  kapasitas: number;
  luas_m2: number | null;
  lantai: number | null;
  nama_gedung: string | null;
}

interface OrganizationOption {
  id: string;
  nama: string;
  singkatan: string | null;
}

interface AjukanPeminjamanFormProps {
  role?: "mahasiswa" | "ketua_organisasi";
}

export default function AjukanPeminjamanForm({ role = "mahasiswa" }: AjukanPeminjamanFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Form Fields
  const [roomId, setRoomId] = useState("");
  const [jenisPeminjaman, setJenisPeminjaman] = useState<"umum" | "organisasi">("umum");
  const [organizationId, setOrganizationId] = useState("");
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [deskripsiKegiatan, setDeskripsiKegiatan] = useState("");
  const [jumlahPeserta, setJumlahPeserta] = useState("1");

  // Tanggal & Waktu
  const [tanggal, setTanggal] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");

  // Upload Dokumen PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ruanganBackHref =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/ruangan"
      : "/dashboard/mahasiswa/ruangan";

  const peminjamanStatusHref =
    role === "ketua_organisasi"
      ? "/dashboard/ketua-organisasi/peminjaman"
      : "/dashboard/mahasiswa/peminjaman";

  useEffect(() => {
    const supabase = createClient();
    const urlParams = new URLSearchParams(window.location.search);

    const requestedRoomId = urlParams.get("ruangan");
    const requestedTanggal = urlParams.get("tanggal");
    const requestedMulai = urlParams.get("mulai");
    const requestedSelesai = urlParams.get("selesai");

    if (requestedTanggal) setTanggal(requestedTanggal);
    if (requestedMulai) setWaktuMulai(requestedMulai);
    if (requestedSelesai) setWaktuSelesai(requestedSelesai);

    async function loadFormOptions() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [
          { data: authData, error: authError },
          { data: roomData, error: roomError },
          { data: organizationData, error: organizationError },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("ruangan")
            .select("id, gedung_id, kode, kapasitas, luas_m2, lantai")
            .eq("status_aktif", true)
            .order("kode"),
          supabase
            .from("organisasi")
            .select("id, nama, singkatan")
            .eq("status_aktif", true)
            .order("nama"),
        ]);

        if (authError) throw authError;
        if (!authData.user) {
          router.replace("/login");
          return;
        }

        setUserId(authData.user.id);

        // Jika ketua_organisasi, cek apakah user adalah ketua dari salah satu ormawa
        if (role === "ketua_organisasi") {
          const { data: myOrg } = await supabase
            .from("organisasi")
            .select("id")
            .eq("ketua_id", authData.user.id)
            .single();

          if (myOrg) {
            setOrganizationId(myOrg.id);
          }
        }

        // Cek apakah user sudah memiliki pengajuan aktif (aturan 1 pengajuan aktif)
        const { data: existingActive, error: activeCheckError } = await supabase
          .from("pengajuan")
          .select("id, nomor_pengajuan, status")
          .eq("pemohon_id", authData.user.id)
          .in("status", ["menunggu_upload", "menunggu_ketua", "menunggu_wd3"])
          .limit(1);

        if (!activeCheckError && existingActive && existingActive.length > 0) {
          setErrorMessage(
            `Anda saat ini memiliki 1 pengajuan aktif (${existingActive[0].nomor_pengajuan}) yang sedang diproses. Mohon tunggu hingga proses selesai.`
          );
        }

        if (roomError) throw roomError;
        if (organizationError) throw organizationError;

        // Ambil nama gedung
        const gedungIds = Array.from(new Set((roomData || []).map((r) => r.gedung_id)));
        const { data: gedungData } = await supabase
          .from("gedung")
          .select("id, nama")
          .in("id", gedungIds);

        const gedungMap = new Map((gedungData || []).map((g) => [g.id, g.nama]));

        const formattedRooms: RoomOption[] = (roomData || []).map((r) => ({
          ...r,
          nama_gedung: gedungMap.get(r.gedung_id) || "Gedung Fakultas",
        }));

        setRooms(formattedRooms);
        setOrganizations(organizationData || []);

        if (requestedRoomId && formattedRooms.some((r) => r.id === requestedRoomId)) {
          setRoomId(requestedRoomId);
        } else if (formattedRooms.length > 0) {
          setRoomId(formattedRooms[0].id);
        }

        if (organizationData && organizationData.length > 0 && !organizationId) {
          setOrganizationId(organizationData[0].id);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal memuat formulir peminjaman."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFormOptions();
  }, [router, role]);

  const selectedRoom = rooms.find((r) => r.id === roomId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMessage("Dokumen permohonan wajib dalam format PDF (.pdf).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Ukuran file maksimal adalah 10 MB.");
        return;
      }
      setErrorMessage(null);
      setPdfFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMessage("Dokumen permohonan wajib dalam format PDF (.pdf).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Ukuran file maksimal adalah 10 MB.");
        return;
      }
      setErrorMessage(null);
      setPdfFile(file);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!userId) {
      setErrorMessage("Sesi login tidak ditemukan. Silakan login kembali.");
      return;
    }
    if (!selectedRoom) {
      setErrorMessage("Pilih ruangan yang ingin dipinjam.");
      return;
    }
    if (!namaKegiatan.trim()) {
      setErrorMessage("Nama kegiatan wajib diisi.");
      return;
    }
    if (jenisPeminjaman === "organisasi" && !organizationId) {
      setErrorMessage("Pilih nama organisasi untuk pengajuan peminjaman jenis organisasi.");
      return;
    }
    if (!tanggal) {
      setErrorMessage("Pilih tanggal pelaksanaan kegiatan.");
      return;
    }
    if (!waktuMulai || !waktuSelesai) {
      setErrorMessage("Tentukan jam mulai dan jam selesai peminjaman.");
      return;
    }
    if (waktuSelesai <= waktuMulai) {
      setErrorMessage("Jam selesai peminjaman harus lebih akhir dari jam mulai.");
      return;
    }
    if (!pdfFile) {
      setErrorMessage("Wajib mengunggah berkas surat permohonan / proposal dalam format PDF.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const startIso = new Date(`${tanggal}T${waktuMulai}:00`).toISOString();
      const endIso = new Date(`${tanggal}T${waktuSelesai}:00`).toISOString();

      if (new Date(startIso).getTime() < Date.now() - 5 * 60 * 1000) {
        throw new Error("Waktu mulai kegiatan tidak boleh di masa lampau.");
      }

      // 1. Cek bentrok jadwal langsung pada tabel public.pengajuan
      const { data: conflicts, error: conflictError } = await supabase
        .from("pengajuan")
        .select("id, status")
        .eq("ruangan_id", selectedRoom.id)
        .in("status", ["menunggu_upload", "menunggu_ketua", "menunggu_wd3", "disetujui"])
        .lt("tanggal_mulai", endIso)
        .gt("tanggal_selesai", startIso)
        .limit(1);

      if (conflictError) throw conflictError;
      if (conflicts && conflicts.length > 0) {
        throw new Error(
          "Ruangan ini sudah dipesan atau sedang diajukan peminjaman pada tanggal dan jam tersebut. Silakan pilih waktu atau ruangan lain."
        );
      }

      // 2. Upload Dokumen PDF ke Supabase Storage
      const cleanFileName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `dokumen_pengajuan/${userId}/${Date.now()}-${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ktm")
        .upload(storagePath, pdfFile, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Gagal mengunggah berkas PDF: " + uploadError.message);
      }

      const { data: urlData } = supabase.storage.from("ktm").getPublicUrl(storagePath);
      const publicPdfUrl = urlData.publicUrl;

      // 3. Tentukan status awal pengajuan:
      // - jenis 'organisasi' -> langsung ke 'menunggu_ketua' (jika bukan ketua itu sendiri) atau 'menunggu_wd3'
      const initialStatus =
        jenisPeminjaman === "organisasi" ? "menunggu_ketua" : "menunggu_wd3";

      const nomorPengajuan = `PJ-${Date.now().toString().slice(-6)}`;

      // 4. Insert data pengajuan ke tabel public.pengajuan
      const { data: pengajuanData, error: pengajuanInsertError } = await supabase
        .from("pengajuan")
        .insert({
          nomor_pengajuan: nomorPengajuan,
          pemohon_id: userId,
          ruangan_id: selectedRoom.id,
          organisasi_id: jenisPeminjaman === "organisasi" ? organizationId : null,
          jenis_peminjaman: jenisPeminjaman,
          nama_kegiatan: namaKegiatan.trim(),
          deskripsi_kegiatan: deskripsiKegiatan.trim() || null,
          jumlah_peserta: Math.max(1, parseInt(jumlahPeserta) || 1),
          tanggal_mulai: startIso,
          tanggal_selesai: endIso,
          status: initialStatus,
        })
        .select()
        .single();

      if (pengajuanInsertError) {
        throw new Error("Gagal membuat data pengajuan: " + pengajuanInsertError.message);
      }

      // 5. Insert record dokumen ke tabel public.dokumen_pengajuan
      if (pengajuanData) {
        const { error: docInsertError } = await supabase
          .from("dokumen_pengajuan")
          .insert({
            pengajuan_id: pengajuanData.id,
            nama_file: pdfFile.name,
            url_file: publicPdfUrl,
            status_dokumen: "diunggah",
            diunggah_oleh: userId,
          });

        if (docInsertError) {
          console.error("Gagal mencatat dokumen pengajuan:", docInsertError);
        }

        // 6. Catat log riwayat status pertama
        await supabase.from("riwayat_status").insert({
          pengajuan_id: pengajuanData.id,
          status_sebelumnya: null,
          status_baru: initialStatus,
          catatan:
            jenisPeminjaman === "organisasi"
              ? "Pengajuan peminjaman organisasi berhasil dikirim. Menunggu verifikasi dan tanda tangan Ketua Organisasi."
              : "Pengajuan peminjaman umum berhasil dikirim. Menunggu verifikasi dan persetujuan Wakil Dekan 3.",
          aktor_id: userId,
        });
      }

      setSuccessMessage(
        `Pengajuan ${nomorPengajuan} berhasil dikirim! Dokumen surat telah tersimpan dan diteruskan ke tahap verifikasi.`
      );
      setNamaKegiatan("");
      setDeskripsiKegiatan("");
      setJumlahPeserta("1");
      setPdfFile(null);

      setTimeout(() => {
        router.push(peminjamanStatusHref);
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Pengajuan gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <Link
        href={ruanganBackHref}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar ruangan
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Formulir Pengajuan Peminjaman Ruangan
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Lengkapi rincian kegiatan, jadwal, dan unggah surat permohonan resmi (PDF)
            </p>
          </div>
        </div>
      </div>

      {/* Info Card: First-Come First-Served & 1 Active Submission */}
      <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
            <Info className="h-4 w-4" />
          </div>
          <div className="text-xs text-sky-900">
            <p className="font-bold">Mekanisme Siapa Cepat Dia Dapat (First-Come, First-Served)</p>
            <p className="mt-0.5 text-sky-700 leading-relaxed">
              Jadwal ruangan akan otomatis terkunci saat Anda mengirimkan formulir beserta berkas surat PDF. Maksimal 1 pengajuan peminjaman aktif per pengguna dalam satu waktu.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-2xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs text-slate-400">Menyiapkan formulir peminjaman...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bagian 1: Pemilihan Ruangan & Kategori */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>1. Ruangan &amp; Kategori Peminjaman</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Pilih Ruangan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} — {r.nama_gedung} (Lt. {r.lantai}, Kapasitas {r.kapasitas} mhs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Kategori Peminjaman <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setJenisPeminjaman("umum")}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                      jenisPeminjaman === "umum"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Umum / Mandiri
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenisPeminjaman("organisasi")}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                      jenisPeminjaman === "organisasi"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Organisasi Mahasiswa
                  </button>
                </div>
              </div>
            </div>

            {jenisPeminjaman === "organisasi" && (
              <div className="pt-2 animate-in fade-in">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Organisasi (HIMA / BEM / UKM) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.nama} {org.singkatan ? `(${org.singkatan})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Surat akan diteruskan ke Ketua Organisasi terkait untuk verifikasi dan tanda tangan digital.
                </p>
              </div>
            )}
          </div>

          {/* Bagian 2: Jadwal & Waktu */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>2. Jadwal &amp; Waktu Pelaksanaan Kegiatan</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Jam Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Jam Selesai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={waktuSelesai}
                  onChange={(e) => setWaktuSelesai(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Bagian 3: Detail Kegiatan */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>3. Detail &amp; Deskripsi Acara</span>
            </h2>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nama Kegiatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Seminar Nasional AI &amp; Cloud Computing 2026"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Perkiraan Jumlah Peserta
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoom ? selectedRoom.kapasitas : 200}
                  value={jumlahPeserta}
                  onChange={(e) => setJumlahPeserta(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {selectedRoom && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Kapasitas maksimal ruangan: {selectedRoom.kapasitas} orang
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Deskripsi / Keperluan Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan secara ringkas agenda acara..."
                  value={deskripsiKegiatan}
                  onChange={(e) => setDeskripsiKegiatan(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Bagian 4: Unggah Berkas PDF Surat Permohonan */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>4. Unggah Dokumen Surat Permohonan (PDF)</span>
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Wajib PDF
              </span>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/50"
                  : pdfFile
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {pdfFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{pdfFile.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Berkas PDF Siap Diunggah
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 mt-1 cursor-pointer"
                  >
                    Ganti Berkas
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Tarik &amp; lepas berkas surat PDF di sini, atau{" "}
                      <span className="text-indigo-600 underline">klik untuk mencari</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format resmi .pdf, ukuran maksimal 10 MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={ruanganBackHref}
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Pengajuan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Permohonan Peminjaman</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
