import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

function StatCard({ value, label, icon, color }: { value: React.ReactNode; label: string; icon: string; color: string }) {
  return (
    <div className="col-6 col-md-3">
      <div className={`card stat-card ${color} shadow-sm`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="value">{value}</div>
              <div>{label}</div>
            </div>
            <i className={`bi ${icon} icon`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let cards: React.ReactNode = null;

  if (session.role === "admin") {
    const [users, alat, pinjam, selesai, menunggu] = await Promise.all([
      prisma.user.count(),
      prisma.alat.count(),
      prisma.peminjaman.count(),
      prisma.peminjaman.count({ where: { status: "selesai" } }),
      prisma.peminjaman.count({ where: { status: "menunggu" } }),
    ]);
    cards = (
      <>
        <StatCard value={users} label="Total User" icon="bi-people" color="bg-primary" />
        <StatCard value={alat} label="Total Alat" icon="bi-tools" color="bg-success" />
        <StatCard value={menunggu} label="Menunggu ACC" icon="bi-hourglass-split" color="bg-warning" />
        <StatCard value={`${selesai}/${pinjam}`} label="Selesai / Total Pinjam" icon="bi-check2-all" color="bg-info" />
      </>
    );
  } else if (session.role === "petugas") {
    const [menunggu, proses, dipinjam, pengembalian] = await Promise.all([
      prisma.peminjaman.count({ where: { status: "menunggu" } }),
      prisma.peminjaman.count({ where: { status: "proses_kembali" } }),
      prisma.peminjaman.count({ where: { status: "dipinjam" } }),
      prisma.pengembalian.count(),
    ]);
    cards = (
      <>
        <StatCard value={menunggu} label="Pengajuan Masuk" icon="bi-hourglass-split" color="bg-warning" />
        <StatCard value={proses} label="Proses Kembali" icon="bi-arrow-counterclockwise" color="bg-primary" />
        <StatCard value={dipinjam} label="Sedang Dipinjam" icon="bi-box-arrow-up-right" color="bg-info" />
        <StatCard value={pengembalian} label="Total Pengembalian" icon="bi-check2-all" color="bg-success" />
      </>
    );
  } else {
    const uid = session.id;
    const [menunggu, aktif, selesai, alat] = await Promise.all([
      prisma.peminjaman.count({ where: { userId: uid, status: "menunggu" } }),
      prisma.peminjaman.count({ where: { userId: uid, status: { in: ["dipinjam", "proses_kembali"] } } }),
      prisma.peminjaman.count({ where: { userId: uid, status: "selesai" } }),
      prisma.alat.count({ where: { stok: { gt: 0 } } }),
    ]);
    cards = (
      <>
        <StatCard value={menunggu} label="Menunggu ACC" icon="bi-hourglass-split" color="bg-warning" />
        <StatCard value={aktif} label="Sedang Dipinjam" icon="bi-box-arrow-up-right" color="bg-info" />
        <StatCard value={selesai} label="Selesai" icon="bi-check2-all" color="bg-success" />
        <StatCard value={alat} label="Alat Tersedia" icon="bi-tools" color="bg-primary" />
      </>
    );
  }

  return (
    <>
      <div className="row g-3 mb-4">{cards}</div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h6 className="mb-0"><i className="bi bi-info-circle"></i> Selamat datang, {session.nama}!</h6>
          <p className="text-muted mb-0 mt-2">
            Anda login sebagai <strong className="text-capitalize">{session.role}</strong>.
            Gunakan menu di sidebar untuk mengakses fitur yang tersedia.
          </p>
        </div>
      </div>
    </>
  );
}
