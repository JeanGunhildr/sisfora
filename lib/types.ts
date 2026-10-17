export type RoleUser = "mahasiswa" | "ketua_organisasi" | "admin" | "wd3";
export type StatusVerifikasi = "menunggu" | "disetujui" | "ditolak";

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  nim?: string | null;
  role: RoleUser;
  url_ktm?: string | null;
  status_verifikasi: StatusVerifikasi;
  alasan_penolakan?: string | null;
  diverifikasi_oleh?: string | null;
  diverifikasi_pada?: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<RoleUser, string> = {
  mahasiswa: "Mahasiswa",
  ketua_organisasi: "Ketua Organisasi",
  admin: "Administrator",
  wd3: "Wakil Dekan 3",
};

export const ROLE_DASHBOARDS: Record<RoleUser, string> = {
  mahasiswa: "/dashboard/mahasiswa",
  ketua_organisasi: "/dashboard/ketua-organisasi",
  admin: "/dashboard/admin",
  wd3: "/dashboard/wd3",
};

