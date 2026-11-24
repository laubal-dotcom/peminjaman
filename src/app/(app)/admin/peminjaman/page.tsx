import { prisma } from "@/lib/db";
import { savePeminjaman, deletePeminjaman } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import AlatRows from "@/components/AlatRows";
import ConfirmForm from "@/components/ConfirmForm";

const PER_PAGE = 10;
const STATUSES = ["menunggu", "dipinjam", "ditolak", "proses_kembali", "selesai"];

export default async function PeminjamanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; new?: string; edit?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const showForm = sp.new === "1";
  const editId = sp.edit ? Number(sp.edit) : null;
  const editP = editId
    ? await prisma.peminjaman.findUnique({
        where: { id: editId },
        include: { user: true, detailPeminjaman: { include: { alat: true } } },
      })
    : null;

  const [total, peminjaman, users, alats] = await Promise.all([
    prisma.peminjaman.count(),
    prisma.peminjaman.findMany({
      include: { user: true, detailPeminjaman: { include: { alat: true } } },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.user.findMany({ where: { role: "peminjam" }, orderBy: { nama: "asc" } }),
    prisma.alat.findMany({ where: { stok: { gt: 0 } }, orderBy: { nama: "asc" } }),
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="bi bi-box-arrow-up-right"></i> Data Peminjaman</h6>
          {!showForm && !editP && <a href="/admin/peminjaman?new=1" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg"></i> Tambah</a>}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Peminjam</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Alat</th><th>Status</th><th className="text-end">Aksi</th></tr>
              </thead>
              <tbody>
                {peminjaman.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Belum ada data.</td></tr>}
                {peminjaman.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.user.nama}</td>
                    <td>{fmt(p.tglPinjam)}</td>
                    <td>{fmt(p.tglKembali)}</td>
                    <td className="small">{p.detailPeminjaman.map((d) => `${d.alat.nama} (x${d.jumlah})`).join(", ")}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-end">
                      <a href={`/admin/peminjaman?edit=${p.id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-pencil"></i></a>
                      {["menunggu", "ditolak"].includes(p.status) && (
                        <ConfirmForm action={deletePeminjaman.bind(null, p.id)} message={`Hapus peminjaman #${p.id}?`} label="Hapus" icon="bi-trash" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white"><Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/admin/peminjaman" /></div>
      </div>

      {showForm && (
        <div className="card shadow-sm">
          <div className="card-header bg-white"><h6 className="mb-0">Tambah Peminjaman</h6></div>
          <div className="card-body">
            <form action={savePeminjaman}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Peminjam</label>
                  <select name="user_id" className="form-select" required>
                    <option value="">-- Pilih Peminjam --</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.nama} ({u.username})</option>)}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Tgl Pinjam</label>
                  <input type="date" name="tgl_pinjam" className="form-control" required defaultValue={fmt(new Date())} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Tgl Kembali</label>
                  <input type="date" name="tgl_kembali" className="form-control" required defaultValue={fmt(new Date(Date.now() + 3 * 86400000))} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select name="status" className="form-select" style={{ maxWidth: 250 }} defaultValue="menunggu">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Keterangan</label>
                <textarea name="keterangan" className="form-control" rows={2}></textarea>
              </div>
              <h6 className="mt-3 mb-2"><i className="bi bi-tools"></i> Detail Alat</h6>
              <AlatRows alats={alats} />
              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary"><i className="bi bi-save"></i> Simpan</button>
                <a href="/admin/peminjaman" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}

      {editP && (
        <div className="card shadow-sm" style={{ maxWidth: 680 }}>
          <div className="card-header bg-white"><h6 className="mb-0">Edit Peminjaman #{editP.id}</h6></div>
          <div className="card-body">
            <form action={savePeminjaman}>
              <input type="hidden" name="id" value={editP.id} />
              <div className="row mb-3">
                <div className="col-md-4"><label className="form-label">Peminjam</label><input className="form-control" value={editP.user.nama} disabled /></div>
                <div className="col-md-4"><label className="form-label">Tgl Pinjam</label><input className="form-control" value={fmt(editP.tglPinjam)} disabled /></div>
                <div className="col-md-4"><label className="form-label">Tgl Kembali</label><input className="form-control" value={fmt(editP.tglKembali)} disabled /></div>
              </div>
              <h6><i className="bi bi-tools"></i> Detail Alat</h6>
              <ul className="list-group mb-3">
                {editP.detailPeminjaman.map((d) => (
                  <li key={d.id} className="list-group-item d-flex justify-content-between">
                    <span>{d.alat.nama}</span><span className="badge bg-primary">x{d.jumlah}</span>
                  </li>
                ))}
              </ul>
              <div className="mb-3" style={{ maxWidth: 250 }}>
                <label className="form-label">Status</label>
                <select name="status" className="form-select" defaultValue={editP.status}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <small className="text-muted">Perubahan status memengaruhi stok otomatis.</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Keterangan</label>
                <textarea name="keterangan" className="form-control" rows={2} defaultValue={editP.keterangan ?? ""}></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary"><i className="bi bi-save"></i> Simpan</button>
                <a href="/admin/peminjaman" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
