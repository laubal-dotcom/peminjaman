const STATUS: Record<string, { label: string; cls: string }> = {
  menunggu: { label: "Menunggu", cls: "bg-warning text-dark" },
  dipinjam: { label: "Dipinjam", cls: "bg-primary" },
  ditolak: { label: "Ditolak", cls: "bg-danger" },
  proses_kembali: { label: "Proses Kembali", cls: "bg-info text-dark" },
  selesai: { label: "Selesai", cls: "bg-success" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-secondary" };
  return <span className={`badge badge-status ${s.cls}`}>{s.label}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const cls = role === "admin" ? "bg-danger" : role === "petugas" ? "bg-warning text-dark" : "bg-info text-dark";
  return <span className={`badge ${cls} text-capitalize`}>{role}</span>;
}
