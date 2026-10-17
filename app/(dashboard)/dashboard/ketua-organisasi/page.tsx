import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";

export default async function KetuaOrganisasiDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nama")
    .eq("id", user.id)
    .single();

  const nama = profile?.nama || user.user_metadata?.nama || user.email?.split("@")[0] || "Ketua Organisasi";

  return (
    <div>
      <WelcomeBanner nama={nama} role="ketua_organisasi" />
    </div>
  );
}
