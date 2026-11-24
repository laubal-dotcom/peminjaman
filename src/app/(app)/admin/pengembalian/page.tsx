import { prisma } from "@/lib/db";
import { savePengembalian, deletePengembalian } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { Pagination } from "@/components/Pagination";
import ConfirmForm from "@/components/ConfirmForm";

const PER_PAGE = 10;

export default async function PengembalianPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; new?: string; edit?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const showForm = sp.new === "1";
  const editId = sp.edit ? Number(sp.edit) : null;

  const [total, pengembalians, editPg, listPeminjaman] = await Promise.all([
    prisma.pengembalian.count(),
    prisma.pengembalian.findMany({
      include: { peminjaman: { include: { user: true } }, petugas: true },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    editId ? prisma.pengembalian.findUnique({ where: { id: editId } }) : null,
    prisma.peminjaman.findMany({
      where: { status: { in: ["dipinjam", "proses_kembali"] } },
      include: { user: true },
      orderBy: { id: "desc" },
    }),
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="bi bi-arrow-counterclockwise"></i> Data Pengembalian</h6>
          {!showForm && !editPg && <a href="/admin/pengembalian?new=1" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg"></i> Tambah</a>}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>ID Pinjam</th><th>Peminjam</th><th>Tgl Kembali</th><th>Denda</th><th className="text-end">Aksi</th></tr>
              </thead>
              <tbody>
                {pengembalians.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Belum ada data.</td></tr>}
                {pengembalians.map((pg) => (
                  <tr key={pg.id}>
                    <td>{pg.id}</td>
                    <td>#{pg.peminjamanId}</td>
                    <td>{pg.peminjaman.user.nama}</td>
                    <td>{fmt(pg.tglKembali)}</td>
                    <td>{Number(pg.denda) > 0 ? <span className="badge bg-danger">Rp {Number(pg.denda).toLocaleString("id-ID")}</span> : <span className="badge bg-success">Rp 0</span>}</td>
                    <td className="text-end">
                      <a href={`/admin/pengembalian?edit=${pg.id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-pencil"></i></a>
                      <ConfirmForm action={deletePengembalian.bind(null, pg.id)} message="Hapus data pengembalian?" label="Hapus" icon="bi-trash" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white"><Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/admin/pengembalian" /></div>
      </div>

      {(showForm || editPg) && (
        <div className="card shadow-sm" style={{ maxWidth: 680 }}>
          <div className="card-header bg-white"><h6 className="mb-0">{editPg ? "Edit Pengembalian" : "Tambah Pengembalian"}</h6></div>
          <div className="card-body">
            <form action={savePengembalian}>
              {editPg && <input type="hidden" name="id" value={editPg.id} />}
              <div className="mb-3">
                <label className="form-label">Peminjaman</label>
                {editPg ? (
                  <input className="form-control" value={`Peminjaman #${editPg.peminjamanId}`} disabled />
                ) : (
                  <select name="peminjaman_id" className="form-select" required defaultValue="">
                    <option value="">-- Pilih Peminjaman --</option>
                    {listPeminjaman.map((p) => (
                      <option key={p.id} value={p.id}>#{p.id} - {p.user.nama} ({p.status})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Tanggal Kembali</label>
                  <input type="date" name="tgl_kembali" className="form-control" required defaultValue={fmt(editPg?.tglKembali ?? new Date())} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Denda (Rp)</label>
                  <input type="number" name="denda" className="form-control" min={0} step={100} defaultValue={Number(editPg?.denda ?? 0)} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Kondisi Alat</label>
                <input type="text" name="kondisi_alat" className="form-control" defaultValue={editPg?.kondisiAlat ?? ""} placeholder="Baik / Rusak Ringan / dll" />
              </div>
              <div className="mb-3">
                <label className="form-label">Keterangan</label>
                <textarea name="keterangan" className="form-control" rows={2} defaultValue={editPg?.keterangan ?? ""}></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary"><i className="bi bi-save"></i> Simpan</button>
                <a href="/admin/pengembalian" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
