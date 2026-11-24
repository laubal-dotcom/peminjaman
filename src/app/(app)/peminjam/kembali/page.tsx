import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ajukanKembali } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import ConfirmForm from "@/components/ConfirmForm";

export default async function KembaliPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const riwayat = await prisma.peminjaman.findMany({
    where: { userId: session!.id, status: { in: ["dipinjam", "proses_kembali"] } },
    include: { detailPeminjaman: { include: { alat: true } } },
    orderBy: { id: "desc" },
  });

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h6 className="mb-0"><i className="bi bi-arrow-counterclockwise"></i> Ajukan Pengembalian Alat</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Tgl Pinjam</th><th>Tgl Kembali Rencana</th><th>Alat</th><th>Status</th><th className="text-end">Aksi</th></tr>
              </thead>
              <tbody>
                {riwayat.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Tidak ada alat yang sedang dipinjam.</td></tr>}
                {riwayat.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{fmt(r.tglPinjam)}</td>
                    <td>{fmt(r.tglKembali)}</td>
                    <td className="small">{r.detailPeminjaman.map((d) => `${d.alat.nama} (x${d.jumlah})`).join(", ")}</td>
                    <td>
                      {r.status === "dipinjam"
                        ? <span className="badge bg-primary">Dipinjam</span>
                        : <span className="badge bg-info text-dark">Proses Kembali</span>}
                    </td>
                    <td className="text-end">
                      {r.status === "dipinjam" ? (
                        <ConfirmForm
                          action={ajukanKembali.bind(null, r.id)}
                          message={`Ajukan pengembalian untuk pinjaman #${r.id}?`}
                          label="Ajukan Kembali"
                          icon="bi-arrow-counterclockwise"
                          className="btn-warning"
                        />
                      ) : (
                        <span className="text-muted small"><i className="bi bi-hourglass-split"></i> Menunggu verifikasi petugas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
