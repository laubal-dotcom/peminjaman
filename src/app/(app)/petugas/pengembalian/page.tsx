import { prisma } from "@/lib/db";
import { konfirmasiPengembalian } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";

const PER_PAGE = 10;
const AKTIF = ["dipinjam", "proses_kembali"];

export default async function PetugasPengembalianPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; form?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const formId = sp.form ? Number(sp.form) : null;

  const [total, peminjaman, detail] = await Promise.all([
    prisma.peminjaman.count({ where: { status: { in: ["dipinjam", "proses_kembali", "selesai"] } } }),
    prisma.peminjaman.findMany({
      where: { status: { in: ["dipinjam", "proses_kembali", "selesai"] } },
      include: { user: true, detailPeminjaman: { include: { alat: true } } },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    formId
      ? prisma.peminjaman.findUnique({
          where: { id: formId },
          include: { user: true, detailPeminjaman: { include: { alat: true } } },
        })
      : null,
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  // Petakan pengembalian terbaru per peminjaman
  const allPg = await prisma.pengembalian.findMany({
    where: { peminjamanId: { in: peminjaman.map((p) => p.id) } },
    orderBy: { id: "desc" },
  });
  const pgMap = new Map<number, (typeof allPg)[number]>();
  for (const pg of allPg) if (!pgMap.has(pg.peminjamanId)) pgMap.set(pg.peminjamanId, pg);

  // Denda otomatis (setara fn_hitung_denda)
  const denda = detail
    ? Math.max(0, Math.floor((Date.now() - detail.tglKembali.getTime()) / 86400000)) * 2000
    : 0;

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <h6 className="mb-0"><i className="bi bi-arrow-counterclockwise"></i> Verifikasi Pengembalian</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Peminjam</th><th>Alat</th><th>Tgl Kembali Rencana</th><th>Status</th><th>Pengembalian</th><th className="text-end">Aksi</th></tr>
              </thead>
              <tbody>
                {peminjaman.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Tidak ada data.</td></tr>}
                {peminjaman.map((p) => {
                  const pg = pgMap.get(p.id);
                  return (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.user.nama}</td>
                      <td className="small">{p.detailPeminjaman.map((d) => `${d.alat.nama} (x${d.jumlah})`).join(", ")}</td>
                      <td>{fmt(p.tglKembali)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="small">
                        {pg ? (
                          <>
                            {fmt(pg.tglKembali)}{" "}
                            {Number(pg.denda) > 0 && <span className="badge bg-danger">Denda Rp {Number(pg.denda).toLocaleString("id-ID")}</span>}
                          </>
                        ) : <span className="text-muted">-</span>}
                      </td>
                      <td className="text-end">
                        {AKTIF.includes(p.status) ? (
                          <a href={`/petugas/pengembalian?form=${p.id}`} className="btn btn-sm btn-primary"><i className="bi bi-check2-circle"></i> Konfirmasi</a>
                        ) : (
                          <span className="text-muted small">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white"><Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/petugas/pengembalian" /></div>
      </div>

      {detail && AKTIF.includes(detail.status) && (
        <div className="card shadow-sm" style={{ maxWidth: 680 }}>
          <div className="card-header bg-white"><h6 className="mb-0">Konfirmasi Pengembalian #{detail.id}</h6></div>
          <div className="card-body">
            <div className="alert alert-info py-2">
              <strong>Peminjam:</strong> {detail.user.nama} &nbsp;|&nbsp;
              <strong>Kembali rencana:</strong> {fmt(detail.tglKembali)}
            </div>
            <h6><i className="bi bi-tools"></i> Alat yang Dikembalikan</h6>
            <ul className="list-group mb-3">
              {detail.detailPeminjaman.map((d) => (
                <li key={d.id} className="list-group-item d-flex justify-content-between">
                  <span>{d.alat.nama}</span><span className="badge bg-primary">x{d.jumlah}</span>
                </li>
              ))}
            </ul>
            <form action={konfirmasiPengembalian.bind(null, detail.id)}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Tanggal Kembali Aktual</label>
                  <input type="date" name="tgl_kembali" className="form-control" required defaultValue={fmt(new Date())} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Denda Otomatis</label>
                  <div className="input-group">
                    <span className="input-group-text">Rp</span>
                    <input type="text" className="form-control" value={denda.toLocaleString("id-ID")} readOnly />
                  </div>
                  <small className="text-muted">Rp2.000/hari keterlambatan</small>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Kondisi Alat</label>
                <select name="kondisi_alat" className="form-select" defaultValue="Baik">
                  <option>Baik</option><option>Baret</option><option>Rusak Ringan</option><option>Rusak Berat</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Keterangan</label>
                <textarea name="keterangan" className="form-control" rows={2}></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success"><i className="bi bi-check-lg"></i> Konfirmasi Pengembalian</button>
                <a href="/petugas/pengembalian" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
