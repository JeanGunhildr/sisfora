import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";

export default async function MahasiswaDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nama, nim, status_verifikasi")
    .eq("id", user.id)
    .single();

  const nama = profile?.nama || user.user_metadata?.nama || user.email?.split("@")[0] || "Mahasiswa";
  const nim = profile?.nim || user.user_metadata?.nim || null;
  const statusVerifikasi = profile?.status_verifikasi || user.user_metadata?.status_verifikasi || "menunggu";

  return (
    <div>
      <WelcomeBanner
        nama={nama}
        role="mahasiswa"
        statusVerifikasi={statusVerifikasi}
        nim={nim}
      />
    </div>
  );
}
