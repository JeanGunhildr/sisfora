"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_DASHBOARDS, RoleUser } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("unverified") === "true") {
      const statusParam = searchParams.get("status");
      setWarningMsg(
        statusParam && statusParam !== "menunggu"
          ? `Sesi dibatasi. Akun Anda saat ini tercatat berstatus "${statusParam}". Anda belum dapat mengakses sistem dashboard.`
          : "Sesi dibatasi. Akun Anda belum disetujui oleh Admin. Mohon tunggu proses verifikasi KTM."
      );
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setWarningMsg(null);

    if (!email || !password) {
      setErrorMsg("Silakan masukkan email dan password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message === "Invalid login credentials" ? "Email atau password tidak sesuai." : error.message);
      }

      if (!data.user) {
        throw new Error("Gagal mengambil informasi akun pengguna.");
      }

      // Ambil data profil dari public.users untuk memeriksa role dan status_verifikasi
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, role, status_verifikasi, alasan_penolakan, nama")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error on login:", profileError);
        await supabase.auth.signOut();
        throw new Error(
          "Data profil akun tidak ditemukan di sistem. Silakan hubungi admin."
        );
      }

      const userRole: RoleUser = (profile?.role ||
        data.user.user_metadata?.role ||
        "mahasiswa") as RoleUser;

      // ATURAN LOGIN: HANYA MAHASISWA BERSTATUS 'diverifikasi' YANG BISA LOGIN
      if (userRole === "mahasiswa") {
        const statusVerifikasi = profile.status_verifikasi;

        if (statusVerifikasi === "menunggu") {
          await supabase.auth.signOut();
          setWarningMsg(
            "Akun Anda sedang menunggu persetujuan Admin (status: menunggu). Berkas Kartu Tanda Mahasiswa (KTM) Anda sedang ditinjau. Anda belum bisa masuk hingga akun diverifikasi oleh admin."
          );
          setLoading(false);
          return;
        }

        if (statusVerifikasi === "ditolak") {
          await supabase.auth.signOut();
          const alasan = profile.alasan_penolakan
            ? ` Alasan penolakan: "${profile.alasan_penolakan}".`
            : "";
          setErrorMsg(
            `Pendaftaran akun Anda ditolak oleh Admin.${alasan} Silakan hubungi bagian kemahasiswaan atau daftar ulang dengan KTM yang valid.`
          );
          setLoading(false);
          return;
        }

        if (statusVerifikasi !== "disetujui") {
          await supabase.auth.signOut();
          setWarningMsg(
            `Akun Anda belum berstatus diverifikasi (status: ${statusVerifikasi}). Mohon hubungi admin.`
          );
          setLoading(false);
          return;
        }
      }

      // Jika role lain (admin, wd3, ketua_organisasi) atau mahasiswa sudah disetujui (diverifikasi)
      const redirectPath = ROLE_DASHBOARDS[userRole] || "/dashboard/mahasiswa";
      window.location.href = redirectPath;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat login.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased font-sans">
      <div className="max-w-md w-full mx-auto">
        {/* Top Gradient Hero Card */}
        <div className="relative overflow-hidden rounded-t-[2.5rem] bg-gradient-to-b from-blue-700 via-blue-600 to-sky-400 p-8 text-center text-white shadow-lg shadow-blue-500/15">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-200/20 rounded-full blur-xl pointer-events-none -ml-10 -mb-10" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-md mb-3">
              <Sparkles className="w-6 h-6 text-sky-200" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">SISFORA</h1>
            <p className="text-xs text-blue-100/90 mt-1 max-w-xs font-normal">
              Sistem Pengajuan & Peminjaman Ruangan Fakultas
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-b-[2.5rem] border-x border-b border-slate-100 shadow-xl shadow-slate-200/70">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan masukkan kredensial akun Anda
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Warning Message (Menunggu Persetujuan) */}
            {warningMsg && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-3 shadow-xs">
                <Clock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block text-amber-900 font-semibold mb-0.5">
                    Menunggu Verifikasi Admin
                  </strong>
                  {warningMsg}
                </div>
              </div>
            )}

            {/* Error Message (Password Salah / Ditolak) */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3 shadow-xs">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block text-rose-900 font-semibold mb-0.5">
                    Gagal Masuk
                  </strong>
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
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
                  placeholder="nama@email.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-5 rounded-full shadow-md shadow-blue-500/25 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 hover:from-blue-800 hover:to-sky-600 active:scale-[0.99] focus:outline-none cursor-pointer transition-all disabled:opacity-70 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Memeriksa Akun...
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-3 border-t border-slate-100 mt-4">
              <p className="text-xs text-slate-500">
                Belum memiliki akun mahasiswa?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Daftar di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
