import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-layout">
      {/* Elemen global dashboard seperti Sidebar atau Navbar diletakkan di sini */}
      {children}
    </section>
  );
}