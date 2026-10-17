"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [ktmFileName, setKtmFileName] = useState("");
  const [ktmPreview, setKtmPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKtmFile(file);
      setKtmFileName(file.name);
      setKtmPreview(URL.createObjectURL(file));
    }
  };

const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama || !nim || !email || !password) {
      setErrorMsg("Mohon lengkapi seluruh kolom formulir.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }

    if (!ktmFile) {
      setErrorMsg("Wajib mengunggah bukti foto Kartu Tanda Mahasiswa (KTM).");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Bukti Foto KTM ke Supabase Storage (bucket: ktm)
      const fileExt = ktmFile.name.split(".").pop();
      const sanitizedNim = nim.replace(/[^a-zA-Z0-9]/g, "");
      const fileName = `${sanitizedNim}_${Date.now()}.${fileExt}`;
      const filePath = `ktm_mahasiswa/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ktm")
        .upload(filePath, ktmFile, {
          cacheControl: "3600",
          upsert: false,
        });

      let publicUrl = "";
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from("ktm")
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      // 2. Registrasi Akun Auth di Supabase
      // Trigger database Anda akan otomatis membaca options.data dan 
      // memasukkannya ke tabel public.users secara aman di sisi server.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nama,
            nim,
            role: "mahasiswa",
            url_ktm: publicUrl || null,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // 3. (DIHAPUS) Tidak perlu upsert manual ke public.users di sini 
      // karena sudah ditangani sepenuhnya oleh Database Trigger.

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased font-sans relative overflow-hidden">
      {/* Warm Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-amber-400/10 via-sky-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full mx-auto relative z-10">
        {/* Mascot Peeking Playfully Outside Card */}
        <div className="absolute -top-16 -right-5 sm:-right-10 z-20 flex flex-col items-end pointer-events-none">
          <div className="mb-1 mr-1 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-2xl rounded-br-xs shadow-md border border-amber-200 text-[11px] font-bold text-slate-800 hidden sm:block animate-pulse">
            Daftar yuk! 🕊️✉️
          </div>
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-xl transition-transform hover:scale-105">
            <Image
              src="/maskot1.png"
              alt="Maskot SISFORA Merpi"
              width={112}
              height={112}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Top Gradient Hero Card matching the new reference style */}
        <div className="relative overflow-hidden rounded-t-[2.5rem] bg-gradient-to-br from-blue-700 via-sky-600 to-amber-500 p-8 text-center text-white shadow-xl shadow-blue-500/20">
          {/* Decorative glass glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-300/20 rounded-full blur-xl pointer-events-none -ml-10 -mb-10" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center p-1 shadow-lg mb-3">
              <Image
                src="/maskot1.png"
                alt="Sisfora Mascot"
                width={38}
                height={38}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Pendaftaran Mahasiswa<span className="text-amber-300">.</span>
            </h1>
            <p className="text-xs text-blue-100/90 mt-1 max-w-sm font-normal">
              Sistem Informasi Pengajuan & Peminjaman Ruangan Fakultas
            </p>
          </div>
        </div>

        {/* Clean White Form Container */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-b-[2.5rem] border-x border-b border-amber-100/80 shadow-xl shadow-amber-500/5">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Pendaftaran Berhasil!
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Akun Anda telah dibuat. Bukti KTM Anda akan diverifikasi oleh Admin. Silakan login untuk melihat dashboard Anda.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full inline-flex justify-center items-center py-3 px-5 rounded-full shadow-md shadow-sky-500/20 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-sky-600 to-amber-500 hover:from-blue-800 hover:to-amber-600 focus:outline-none cursor-pointer transition-all"
                >
                  Masuk ke Halaman Login
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Muhammad Rifqi"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* NIM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  NIM (Nomor Induk Mahasiswa)
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 21081010001"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Mahasiswa
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@mahasiswa.ac.id"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative rounded-2xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ulangi Password
                  </label>
                  <div className="relative rounded-2xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Foto KTM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bukti Foto KTM (Kartu Tanda Mahasiswa)
                </label>
                <div className="mt-1 flex justify-center px-4 pt-4 pb-4 border-2 border-slate-200 border-dashed rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer relative bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-center">
                    {ktmPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={ktmPreview}
                          alt="Preview KTM"
                          className="h-28 object-contain rounded-xl border border-slate-200 shadow-xs mb-2"
                        />
                        <p className="text-xs text-blue-600 font-semibold">
                          {ktmFileName} (Klik untuk mengganti)
                        </p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-8 w-8 text-blue-500" />
                        <div className="flex text-xs text-slate-600 justify-center">
                          <span className="font-semibold text-blue-600 hover:underline">
                            Pilih file foto KTM
                          </span>
                          <span className="pl-1">atau drag and drop</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Format PNG, JPG, JPEG (Maks. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Pill Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-5 rounded-full shadow-md shadow-sky-500/25 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-sky-600 to-amber-500 hover:from-blue-800 hover:to-amber-600 active:scale-[0.99] focus:outline-none cursor-pointer transition-all disabled:opacity-70 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Mendaftarkan Akun...
                    </>
                  ) : (
                    "Daftar Sebagai Mahasiswa"
                  )}
                </button>
              </div>

              <div className="text-center pt-3 border-t border-slate-100 mt-4">
                <p className="text-xs text-slate-500">
                  Sudah memiliki akun?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-sky-600 hover:text-amber-600 hover:underline"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
