import { prisma } from "@/lib/db";
import { saveKategori, deleteKategori } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { Pagination } from "@/components/Pagination";
import ConfirmForm from "@/components/ConfirmForm";

const PER_PAGE = 10;

export default async function KategoriPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; edit?: string; new?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const editId = sp.edit ? Number(sp.edit) : null;
  const showForm = sp.new === "1" || editId;

  const [total, kategoris, editKategori] = await Promise.all([
    prisma.kategori.count(),
    prisma.kategori.findMany({ orderBy: { id: "asc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    editId ? prisma.kategori.findUnique({ where: { id: editId } }) : null,
  ]);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="bi bi-tags"></i> Data Kategori</h6>
          {!showForm && <a href="/admin/kategori?new=1" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg"></i> Tambah</a>}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light"><tr><th>#</th><th>Nama</th><th>Deskripsi</th><th className="text-end">Aksi</th></tr></thead>
              <tbody>
                {kategoris.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-4">Belum ada data.</td></tr>}
                {kategoris.map((k, i) => (
                  <tr key={k.id}>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td>{k.nama}</td>
                    <td>{k.deskripsi ?? "-"}</td>
                    <td className="text-end">
                      <a href={`/admin/kategori?edit=${k.id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-pencil"></i></a>
                      <ConfirmForm action={deleteKategori.bind(null, k.id)} message={`Hapus kategori ${k.nama}?`} label="Hapus" icon="bi-trash" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white"><Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/admin/kategori" /></div>
      </div>

      {showForm && (
        <div className="card shadow-sm" style={{ maxWidth: 640 }}>
          <div className="card-header bg-white"><h6 className="mb-0">{editKategori ? "Edit Kategori" : "Tambah Kategori"}</h6></div>
          <div className="card-body">
            <form action={saveKategori}>
              <input type="hidden" name="id" value={editKategori?.id ?? ""} />
              <div className="mb-3">
                <label className="form-label">Nama Kategori</label>
                <input type="text" name="nama" className="form-control" required defaultValue={editKategori?.nama} />
              </div>
              <div className="mb-3">
                <label className="form-label">Deskripsi</label>
                <textarea name="deskripsi" className="form-control" rows={3} defaultValue={editKategori?.deskripsi ?? ""}></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary"><i className="bi bi-save"></i> Simpan</button>
                <a href="/admin/kategori" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
