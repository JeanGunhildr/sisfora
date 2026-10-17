import React from "react";
import { requireRole } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KetuaTandaTanganView from "./KetuaTandaTanganView";

export default async function KetuaTandaTanganPage() {
  const { user, profile } = await requireRole(["ketua_organisasi"]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        nama={profile.nama}
        roleTitle="Ketua Organisasi"
        role="ketua_organisasi"
      />
      <KetuaTandaTanganView ketuaId={user.id} ketuaNama={profile.nama} />
    </div>
  );
}
