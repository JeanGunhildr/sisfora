import React from "react";
import { requireRole } from "@/lib/auth";

export default async function KetuaOrganisasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hanya role 'ketua_organisasi' yang dapat mengakses seluruh halaman /dashboard/ketua-organisasi/*
  await requireRole(["ketua_organisasi"]);

  return <>{children}</>;
}
