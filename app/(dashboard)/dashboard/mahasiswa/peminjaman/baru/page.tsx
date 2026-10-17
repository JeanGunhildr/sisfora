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

export default function PengajuanPeminjamanPage() {
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

  // Tanggal & Waktu (Sesuai tugas)
  const [tanggal, setTanggal] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");

  // Upload Dokumen PDF (Sesuai tugas)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const urlParams = new URLSearchParams(window.location.search);

    // Otomatis terisi dari filter URL jika ada
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
        if (roomError) throw roomError;
        if (organizationError) throw organizationError;

        const roomRows = roomData ?? [];
        const buildingIds = [...new Set(roomRows.map((room) => room.gedung_id))];

        const { data: buildingData } = buildingIds.length
          ? await supabase.from("gedung").select("id, nama").in("id", buildingIds)
          : { data: [] };

        const buildingNames = new Map(
          (buildingData ?? []).map((building) => [building.id, building.nama])
        );

        const activeRooms: RoomOption[] = roomRows.map((room) => ({
          ...room,
          nama_gedung: buildingNames.get(room.gedung_id) ?? null,
        }));

        setUserId(authData.user.id);
        setRooms(activeRooms);
        setOrganizations(organizationData ?? []);

        // Pilih ruangan jika ada dari parameter
        if (requestedRoomId && activeRooms.some((room) => room.id === requestedRoomId)) {
          setRoomId(requestedRoomId);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Gagal memuat pilihan pengajuan.");
      } finally {
        setLoading(false);
      }
    }

    void loadFormOptions();
  }, [router]);

  const selectedRoom = rooms.find((room) => room.id === roomId);

  // File handler
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

    const participants = Number(jumlahPeserta);
    if (!Number.isInteger(participants) || participants < 1) {
      setErrorMessage("Jumlah peserta minimal 1 orang.");
      return;
    }
    if (participants > selectedRoom.kapasitas) {
      setErrorMessage(
        `Jumlah peserta (${participants}) melebihi kapasitas ruangan (${selectedRoom.kapasitas} orang).`
      );
      return;
    }

    // Dokumen surat PDF wajib diunggah
    if (!pdfFile) {
      setErrorMessage("Silakan lampirkan dokumen surat permohonan peminjaman dalam format PDF.");
      return;
    }

    const start = new Date(`${tanggal}T${waktuMulai}:00`);
    const end = new Date(`${tanggal}T${waktuSelesai}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setErrorMessage("Format tanggal atau waktu tidak valid.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      // 1. Cek bentrok jadwal langsung pada tabel public.pengajuan
      const { data: conflicts, error: conflictError } = await supabase
        .from("pengajuan")
        .select("id, nomor_pengajuan")
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
      // - jenis 'organisasi' -> langsung ke 'menunggu_ketua' (karena berkas sudah diupload)
      // - jenis 'umum' -> langsung ke 'menunggu_wd3' (langsung ke Dekanat)
      const initialStatus =
        jenisPeminjaman === "organisasi" ? "menunggu_ketua" : "menunggu_wd3";

      const nomorPengajuan = `SFR-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      // 4. Insert data ke public.pengajuan
      const { data: pengajuanData, error: insertError } = await supabase
        .from("pengajuan")
        .insert({
          nomor_pengajuan: nomorPengajuan,
          pemohon_id: userId,
          ruangan_id: selectedRoom.id,
          jenis_peminjaman: jenisPeminjaman,
          organisasi_id: jenisPeminjaman === "organisasi" ? organizationId : null,
          nama_kegiatan: namaKegiatan.trim(),
          deskripsi_kegiatan: deskripsiKegiatan.trim() || null,
          jumlah_peserta: participants,
          tanggal_mulai: startIso,
          tanggal_selesai: endIso,
          status: initialStatus,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // 5. Insert berkas ke public.dokumen_pengajuan
      if (pengajuanData) {
        await supabase.from("dokumen_pengajuan").insert({
          pengajuan_id: pengajuanData.id,
          url_file: publicPdfUrl,
          nama_file: pdfFile.name,
          mime_type: "application/pdf",
          ukuran_byte: pdfFile.size,
          status_dokumen: "diunggah",
          diunggah_oleh: userId,
        });

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

      // Arahkan ke halaman status setelah 1.5 detik
      setTimeout(() => {
        router.push("/dashboard/mahasiswa/peminjaman");
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
        href="/dashboard/mahasiswa/ruangan"
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

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 animate-in fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Berhasil Dikirim</span>
          </div>
          <p className="mt-1">{successMessage}</p>
          <p className="mt-2 text-emerald-700">Mengarahkan Anda ke halaman Status Peminjaman...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-xs text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span>Memuat pilihan ruangan dan data organisasi...</span>
          </div>
        ) : (
          <>
            {/* Bagian 1: Ruangan & Kategori */}
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                1. Pemilihan Fasilitas & Kategori Peminjaman
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                  Ruangan Fakultas
                  <select
                    required
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    <option value="">Pilih ruangan yang tersedia</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.kode} — {room.nama_gedung || "Gedung"} (Kapasitas {room.kapasitas} mhs)
                      </option>
                    ))}
                  </select>
                  {selectedRoom && (
                    <span className="block text-[11px] font-normal text-slate-500">
                      Lantai {selectedRoom.lantai ?? "-"} · Kapasitas maks. {selectedRoom.kapasitas} peserta
                    </span>
                  )}
                </label>

                <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                  Jenis Peminjaman
                  <select
                    value={jenisPeminjaman}
                    onChange={(e) => setJenisPeminjaman(e.target.value as "umum" | "organisasi")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    <option value="umum">Umum (Akademik / Mandiri / Diskusi)</option>
                    <option value="organisasi">Kegiatan Organisasi (HIMA / UKM / BEM)</option>
                  </select>
                  <span className="block text-[11px] font-normal text-slate-500">
                    {jenisPeminjaman === "organisasi"
                      ? "Diteruskan ke Ketua Organisasi ➔ WD3"
                      : "Diteruskan langsung ke Wakil Dekan 3"}
                  </span>
                </label>
              </div>

              {/* Pilihan Organisasi jika jenis peminjaman == 'organisasi' */}
              {jenisPeminjaman === "organisasi" && (
                <div className="mt-4">
                  <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
                    Pilih Organisasi / Lembaga Mahasiswa
                    <select
                      required
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                    >
                      <option value="">Pilih organisasi terkait</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.nama} {org.singkatan ? `(${org.singkatan})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

            {/* Bagian 2: Tanggal, Waktu Mulai & Waktu Selesai (Auto terisi dari filter jika ada) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Jadwal & Waktu Pelaksanaan Kegiatan
                </h2>
                {(tanggal || waktuMulai || waktuSelesai) && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Waktu Terisi Otomatis
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Tanggal */}
                <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                  Tanggal Kegiatan
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </label>

                {/* Waktu Mulai */}
                <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                  Jam Mulai
                  <input
                    required
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </label>

                {/* Waktu Selesai */}
                <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                  Jam Selesai
                  <input
                    required
                    type="time"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </label>
              </div>
            </div>

            {/* Bagian 3: Detail Kegiatan & Peserta */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Detail & Keperluan Kegiatan
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700 block">
                    Nama Kegiatan
                    <input
                      required
                      maxLength={150}
                      value={namaKegiatan}
                      onChange={(e) => setNamaKegiatan(e.target.value)}
                      placeholder="Contoh: Rapat Kerja Anggota / Seminar Teknologi"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </label>
                </div>

                <div>
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700 block">
                    Jumlah Peserta (Orang)
                    <input
                      required
                      type="number"
                      min={1}
                      max={selectedRoom?.kapasitas || 100}
                      value={jumlahPeserta}
                      onChange={(e) => setJumlahPeserta(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </label>
                </div>
              </div>

              <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
                Deskripsi Kegiatan <span className="font-normal text-slate-400">(Opsional)</span>
                <textarea
                  rows={3}
                  value={deskripsiKegiatan}
                  onChange={(e) => setDeskripsiKegiatan(e.target.value)}
                  placeholder="Jelaskan secara ringkas susunan acara atau kebutuhan fasilitas khusus."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-normal text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </label>
            </div>

            {/* Bagian 4: Upload Dokumen Surat Permohonan (Wajib PDF) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Unggah Dokumen Surat Permohonan (PDF)
                </h2>
                <span className="text-[11px] text-indigo-600 font-semibold">Format .PDF (Maks. 10MB)</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Surat ini akan ditandatangani secara digital oleh penanda tangan terkait ({jenisPeminjaman === "organisasi" ? "Ketua Organisasi lalu Wakil Dekan 3" : "Wakil Dekan 3"}).
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!pdfFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk memilih berkas atau seret file PDF ke sini
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pastikan surat permohonan telah dikonversi ke format PDF sebelum diunggah
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{pdfFile.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · Dokumen PDF siap diunggah
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 text-[11px] font-semibold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus berkas"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/mahasiswa/ruangan"
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-center text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting || loading || rooms.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-indigo-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengirim & Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kirim Pengajuan Peminjaman</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}