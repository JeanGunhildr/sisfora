import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusPeminjamanView from "@/components/peminjaman/StatusPeminjamanView";

export default async function MahasiswaStatusPeminjamanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: pengajuanList } = await supabase
    .from("pengajuan")
    .select(`
      id,
      nomor_pengajuan,
      nama_kegiatan,
      deskripsi_kegiatan,
      jenis_peminjaman,
      jumlah_peserta,
      status,
      alasan_penolakan,
      tanggal_mulai,
      tanggal_selesai,
      created_at,
      ruangan:ruangan_id(
        id,
        kode,
        deskripsi,
        lantai,
        url_foto,
        gedung:gedung_id(id, nama)
      ),
      organisasi:organisasi_id(id, nama, singkatan),
      dokumen_pengajuan(id, nama_file, url_file, status_dokumen, updated_at),
      riwayat_status(id, status_sebelumnya, status_baru, catatan, created_at, aktor:aktor_id(nama))
    `)
    .eq("pemohon_id", user.id)
    .order("created_at", { ascending: false });

  return <StatusPeminjamanView pengajuanList={pengajuanList || []} role="mahasiswa" />;
}