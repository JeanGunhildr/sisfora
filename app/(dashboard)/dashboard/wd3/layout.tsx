import React from "react";
import { requireRole } from "@/lib/auth";

export default async function WD3Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hanya role 'wd3' yang dapat mengakses seluruh halaman /dashboard/wd3/*
  await requireRole(["wd3"]);

  return <>{children}</>;
}
