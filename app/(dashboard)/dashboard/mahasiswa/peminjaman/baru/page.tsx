import React from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AjukanPeminjamanForm from "./AjukanPeminjamanForm";

export default async function AjukanPeminjamanBaruPage() {
  const { user, profile } = await requireRole(["mahasiswa", "ketua_organisasi"]);
  const supabase = await createClient();

  // Fetch daftar ruangan aktif untuk pilihan
  const { data: ruanganList } = await supabase
    .from("ruangan")
    .select("id, kode, kapasitas, lantai, gedung:gedung!ruangan_gedung_id_fkey(nama)")
    .eq("status_aktif", true)
    .order("kode", { ascending: true });

  // Fetch daftar organisasi aktif untuk pilihan
  const { data: organisasiList } = await supabase
    .from("organisasi")
    .select("id, nama, singkatan")
    .eq("status_aktif", true)
    .order("nama", { ascending: true });

  return (
    <div className="space-y-6">
      <DashboardHeader
        nama={profile.nama}
        roleTitle="Pengajuan Peminjaman Ruangan"
        role={profile.role}
      />
      <AjukanPeminjamanForm
        userId={user.id}
        userNama={profile.nama}
        ruangans={(ruanganList as any) || []}
        organisasis={organisasiList || []}
      />
    </div>
  );
}
