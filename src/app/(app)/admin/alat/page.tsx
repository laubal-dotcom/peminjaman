import { prisma } from "@/lib/db";
import { saveAlat, deleteAlat } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import ConfirmForm from "@/components/ConfirmForm";

export default async function AlatPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const editId = sp.edit ? Number(sp.edit) : null;
  const showForm = sp.new === "1" || editId;

  const [alats, kategoris, editAlat] = await Promise.all([
    prisma.alat.findMany({ include: { kategori: true }, orderBy: { nama: "asc" } }),
    prisma.kategori.findMany({ orderBy: { nama: "asc" } }),
    editId ? prisma.alat.findUnique({ where: { id: editId } }) : null,
  ]);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="bi bi-tools"></i> Data Alat & Stok</h6>
          {!showForm && <a href="/admin/alat?new=1" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg"></i> Tambah Alat</a>}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Kode</th><th>Nama Alat</th><th>Kategori</th><th>Stok</th><th className="text-end">Aksi</th></tr>
              </thead>
              <tbody>
                {alats.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Belum ada data.</td></tr>}
                {alats.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td><code>{a.kode ?? "-"}</code></td>
                    <td>{a.nama}</td>
                    <td><span className="badge bg-secondary">{a.kategori.nama}</span></td>
                    <td>{a.stok > 0 ? <span className="badge bg-success">{a.stok}</span> : <span className="badge bg-danger">Habis</span>}</td>
                    <td className="text-end">
                      <a href={`/admin/alat?edit=${a.id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-pencil"></i></a>
                      <ConfirmForm action={deleteAlat.bind(null, a.id)} message={`Hapus alat ${a.nama}?`} label="Hapus" icon="bi-trash" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card shadow-sm" style={{ maxWidth: 680 }}>
          <div className="card-header bg-white"><h6 className="mb-0">{editAlat ? "Edit Alat" : "Tambah Alat"}</h6></div>
          <div className="card-body">
            <form action={saveAlat}>
              <input type="hidden" name="id" value={editAlat?.id ?? ""} />
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Kategori</label>
                  <select name="kategori_id" className="form-select" required defaultValue={editAlat?.kategoriId ?? ""}>
                    <option value="">-- Pilih Kategori --</option>
                    {kategoris.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Kode Alat</label>
                  <input type="text" name="kode" className="form-control" defaultValue={editAlat?.kode ?? ""} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Nama Alat</label>
                <input type="text" name="nama" className="form-control" required defaultValue={editAlat?.nama} />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Stok</label>
                  <input type="number" name="stok" className="form-control" min={0} required defaultValue={editAlat?.stok ?? 0} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Deskripsi</label>
                <textarea name="deskripsi" className="form-control" rows={3} defaultValue={editAlat?.deskripsi ?? ""}></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary"><i className="bi bi-save"></i> Simpan</button>
                <a href="/admin/alat" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
