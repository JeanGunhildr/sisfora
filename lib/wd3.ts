export interface DokumenPengajuanItem {
  id: string;
  url_file: string;
  nama_file: string;
  status_dokumen: string;
  updated_at?: string;
}

export interface PengajuanLike {
  jenis_peminjaman?: string;
  organisasi_id?: string | null;
  dokumen_pengajuan?: DokumenPengajuanItem[];
}

/**
 * Mencari dokumen relevan untuk proses persetujuan WD3.
 * Server-safe helper yang dapat diimpor baik oleh Server Component maupun Client Component.
 */
export function getRelevantDokumen(item: PengajuanLike): DokumenPengajuanItem | null {
  const docs = item.dokumen_pengajuan;
  if (!docs || docs.length === 0) return null;

  // Untuk kategori organisasi, prioritaskan dokumen yang sudah ditandatangani Ketua Organisasi
  if (item.jenis_peminjaman === "organisasi" || Boolean(item.organisasi_id)) {
    const signedByKetua = docs.find((d) => d.status_dokumen === "ditandatangani_ketua");
    if (signedByKetua) return signedByKetua;
  }

  // Dokumen yang sudah ditandatangani WD3 / final
  const signedByWD3 = docs.find(
    (d) => d.status_dokumen === "ditandatangani_wd3" || d.status_dokumen === "final"
  );
  if (signedByWD3) return signedByWD3;

  // Dokumen terbaru yang diunggah
  const sorted = [...docs].sort(
    (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
  );
  return sorted[0] || null;
}
