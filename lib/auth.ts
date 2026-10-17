import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleUser, ROLE_DASHBOARDS, UserProfile, StatusVerifikasi } from "@/lib/types";

/**
 * Memverifikasi bahwa user telah login dan akun mahasiswa sudah diverifikasi.
 * Jika belum login -> redirect ke /login
 * Jika mahasiswa belum diverifikasi -> sign out & redirect ke /login?unverified=true
 */
export async function requireAuth(): Promise<{ user: any; profile: UserProfile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const role: RoleUser = (profile?.role ||
    user.user_metadata?.role ||
    "mahasiswa") as RoleUser;

  const statusVerifikasi: StatusVerifikasi =
  profile?.status_verifikasi === "disetujui"
    ? "disetujui"
    : profile?.status_verifikasi === "ditolak"
    ? "ditolak"
    : "menunggu";

  // Mahasiswa harus berstatus 'disetujui' untuk dapat mengakses area dashboard
  if (role === "mahasiswa" && statusVerifikasi !== "disetujui") {
    await supabase.auth.signOut();
    redirect(`/login?unverified=true&status=${statusVerifikasi}`);
  }

  const safeProfile: UserProfile = {
    id: user.id,
    nama: profile?.nama || user.user_metadata?.nama || user.email?.split("@")[0] || "Pengguna",
    email: user.email || profile?.email || "",
    nim: profile?.nim || user.user_metadata?.nim || null,
    role,
    url_ktm: profile?.url_ktm || null,
    status_verifikasi: statusVerifikasi,
    alasan_penolakan: profile?.alasan_penolakan || null,
    diverifikasi_oleh: profile?.diverifikasi_oleh || null,
    diverifikasi_pada: profile?.diverifikasi_pada || null,
    created_at: profile?.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || new Date().toISOString(),
  };

  return { user, profile: safeProfile };
}

/**
 * Memastikan user memiliki salah satu dari role yang diizinkan.
 * Jika role tidak cocok, pengguna akan diarahkan ke dashboard role-nya sendiri.
 * Mahasiswa yang mencoba akses /dashboard/admin akan otomatis dipental ke /dashboard/mahasiswa.
 */
export async function requireRole(allowedRoles: RoleUser[]): Promise<{ user: any; profile: UserProfile }> {
  const { user, profile } = await requireAuth();

  if (!allowedRoles.includes(profile.role)) {
    const targetDashboard = ROLE_DASHBOARDS[profile.role] || "/dashboard/mahasiswa";
    redirect(targetDashboard);
  }

  return { user, profile };
}
