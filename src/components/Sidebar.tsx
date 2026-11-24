"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENUS: Record<string, { label: string; href: string; icon: string }[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "bi-speedometer2" },
    { label: "Data User", href: "/admin/users", icon: "bi-people" },
    { label: "Kategori", href: "/admin/kategori", icon: "bi-tags" },
    { label: "Alat & Stok", href: "/admin/alat", icon: "bi-tools" },
    { label: "Peminjaman", href: "/admin/peminjaman", icon: "bi-box-arrow-up-right" },
    { label: "Pengembalian", href: "/admin/pengembalian", icon: "bi-arrow-counterclockwise" },
    { label: "Log Aktivitas", href: "/admin/log-aktivitas", icon: "bi-journal-text" },
  ],
  petugas: [
    { label: "Dashboard", href: "/dashboard", icon: "bi-speedometer2" },
    { label: "Persetujuan", href: "/petugas/persetujuan", icon: "bi-check2-square" },
    { label: "Pengembalian", href: "/petugas/pengembalian", icon: "bi-arrow-counterclockwise" },
    { label: "Laporan", href: "/petugas/laporan", icon: "bi-file-earmark-bar-graph" },
  ],
  peminjam: [
    { label: "Dashboard", href: "/dashboard", icon: "bi-speedometer2" },
    { label: "Daftar Alat", href: "/peminjam/alat", icon: "bi-tools" },
    { label: "Ajukan Pinjam", href: "/peminjam/pinjam", icon: "bi-box-arrow-up-right" },
    { label: "Kembali Alat", href: "/peminjam/kembali", icon: "bi-arrow-counterclockwise" },
  ],
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const menu = MENUS[role] ?? [];

  return (
    <div className="sidebar" id="sidebar">
      <Link href="/dashboard" className="brand">
        <i className="bi bi-box-seam"></i> Peminjaman Alat
      </Link>
      <div className="menu-label">Menu Utama</div>
      <nav className="nav flex-column">
        {menu.map((m) => {
          const active = pathname === m.href || pathname.startsWith(m.href + "/");
          return (
            <Link key={m.href} href={m.href} className={`nav-link${active ? " active" : ""}`}>
              <i className={`bi ${m.icon}`}></i> {m.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
