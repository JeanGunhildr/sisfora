import React from "react";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hanya role 'admin' yang dapat mengakses seluruh halaman /dashboard/admin/*
  await requireRole(["admin"]);

  return <>{children}</>;
}
