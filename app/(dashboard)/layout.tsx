import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/dashboard/Topbar";
import { RoleUser } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile from public.users
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const role: RoleUser = (profile?.role || user.user_metadata?.role || "mahasiswa") as RoleUser;
  const nama = profile?.nama || user.user_metadata?.nama || user.email?.split("@")[0] || "Pengguna";
  const nim = profile?.nim || user.user_metadata?.nim || null;

  return (
    <div className="min-h-screen bg-[#F0F4FA] text-slate-800 antialiased font-sans py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col">
        {/* Modern Topbar matching reference design */}
        <Topbar nama={nama} role={role} nim={nim} />

        {/* Main Content Area */}
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
}