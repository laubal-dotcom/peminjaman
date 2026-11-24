import { prisma } from "@/lib/db";
import { Pagination } from "@/components/Pagination";

const PER_PAGE = 10;

export default async function LogAktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [total, logs] = await Promise.all([
    prisma.logAktivitas.count(),
    prisma.logAktivitas.findMany({
      include: { user: true },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <h6 className="mb-0"><i className="bi bi-journal-text"></i> Log Aktivitas Sistem</h6>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light"><tr><th>#</th><th>Waktu</th><th>User</th><th>Aksi</th><th>Detail</th></tr></thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">Belum ada log.</td></tr>}
              {logs.map((log, i) => (
                <tr key={log.id}>
                  <td>{(page - 1) * PER_PAGE + i + 1}</td>
                  <td className="text-nowrap">{log.createdAt.toLocaleString("id-ID")}</td>
                  <td>{log.user ? `${log.user.nama} (${log.user.username})` : "-"}</td>
                  <td><span className="badge bg-primary">{log.aksi}</span></td>
                  <td className="small">{log.detail ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer bg-white">
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/admin/log-aktivitas" />
      </div>
    </div>
  );
}
