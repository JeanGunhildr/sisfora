"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Mail, CreditCard, Lock, Camera, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PengaturanAkunPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<{
    id: string;
    nama: string;
    email: string;
    nim: string | null;
    url_ktm: string | null;
    role: string;
    status_verifikasi: string;
  } | null>(null);

  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKtm, setUploadingKtm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Password change
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (data) {
        setProfile({ ...data, email: user.email || data.email });
        setNama(data.nama);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSaveName = async () => {
    if (!profile || !nama.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ nama: nama.trim(), updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) {
      showFeedback("error", "Gagal menyimpan nama: " + error.message);
    } else {
      setProfile((prev) => prev ? { ...prev, nama: nama.trim() } : prev);
      showFeedback("success", "Nama berhasil diperbarui.");
    }
    setSaving(false);
  };

  const handleUploadKtm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      showFeedback("error", "Ukuran file maksimal 5 MB.");
      return;
    }

    setUploadingKtm(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/ktm.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("ktm")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("ktm").getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("users")
        .update({ url_ktm: url, status_verifikasi: "menunggu", updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, url_ktm: url, status_verifikasi: "menunggu" } : prev);
      showFeedback("success", "Foto KTM berhasil diperbarui. Status verifikasi kembali ke Menunggu.");
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Gagal mengunggah KTM.");
    } finally {
      setUploadingKtm(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showFeedback("error", "Password baru tidak cocok atau kosong.");
      return;
    }
    if (newPassword.length < 8) {
      showFeedback("error", "Password minimal 8 karakter.");
      return;
    }

    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showFeedback("error", "Gagal mengubah password: " + error.message);
    } else {
      showFeedback("success", "Password berhasil diubah.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPass(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const STATUS_LABEL: Record<string, string> = {
    menunggu: "Menunggu Verifikasi",
    diverifikasi: "Terverifikasi",
    ditolak: "Ditolak",
  };

  const STATUS_COLOR: Record<string, string> = {
    menunggu: "bg-amber-50 text-amber-700 border-amber-200",
    diverifikasi: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ditolak: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Avatar + KTM */}
        <div className="bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-extrabold shadow-md overflow-hidden">
              {profile?.url_ktm ? (
                <img src={profile.url_ktm} alt="KTM" className="w-full h-full object-cover" />
              ) : (
                profile?.nama.charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingKtm}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {uploadingKtm ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadKtm}
            />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{profile?.nama}</p>
            <p className="text-xs text-blue-100/80">{profile?.email}</p>
            <span
              className={`mt-1.5 inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                STATUS_COLOR[profile?.status_verifikasi || "menunggu"]
              }`}
            >
              {STATUS_LABEL[profile?.status_verifikasi || "menunggu"]}
            </span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 space-y-5">
          {/* Nama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={saving || !nama.trim() || nama === profile?.nama}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={profile?.email || ""}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Email tidak dapat diubah.</p>
          </div>

          {/* NIM (readonly) */}
          {profile?.nim && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                NIM
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profile.nim}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Upload KTM Button (text) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Foto KTM
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingKtm}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all cursor-pointer disabled:opacity-60"
            >
              {uploadingKtm ? (
                <Loader2 size={14} className="animate-spin text-blue-600" />
              ) : (
                <Camera size={14} />
              )}
              {uploadingKtm ? "Mengunggah..." : "Ganti Foto KTM"}
            </button>
            <p className="text-[10px] text-slate-400 mt-1">
              Mengganti foto KTM akan mereset status verifikasi ke Menunggu. Maks. 5 MB.
            </p>
          </div>
        </div>
      </div>

      {/* Password Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Ubah Password</h2>
        <p className="text-xs text-slate-400 mb-5">Pastikan password baru Anda minimal 8 karakter.</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password Baru</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Konfirmasi Password Baru</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
          >
            {changingPass ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {changingPass ? "Mengubah..." : "Ubah Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
