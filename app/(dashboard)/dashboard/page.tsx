import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARDS, RoleUser } from "@/lib/types";

export default async function DashboardRootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: RoleUser = (profile?.role || user.user_metadata?.role || "mahasiswa") as RoleUser;
  const targetDashboard = ROLE_DASHBOARDS[role] || "/dashboard/mahasiswa";

  redirect(targetDashboard);
}