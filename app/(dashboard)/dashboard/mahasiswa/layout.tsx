import React from "react";
import { requireRole } from "@/lib/auth";

export default async function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mahasiswa dan Ketua Organisasi dapat mengakses halaman mahasiswa
  await requireRole(["mahasiswa", "ketua_organisasi"]);

  return <>{children}</>;
}
