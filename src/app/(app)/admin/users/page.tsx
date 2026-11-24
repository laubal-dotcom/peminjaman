import { prisma } from "@/lib/db";
import { saveUser, deleteUser } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { Pagination } from "@/components/Pagination";
import { RoleBadge } from "@/components/StatusBadge";
import ConfirmForm from "@/components/ConfirmForm";

const PER_PAGE = 10;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; edit?: string; new?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const editId = sp.edit ? Number(sp.edit) : null;
  const showForm = sp.new === "1" || editId;

  const [total, users, editUser] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({ orderBy: { id: "asc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    editId ? prisma.user.findUnique({ where: { id: editId } }) : null,
  ]);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="bi bi-people"></i> Data User</h6>
          {!showForm && (
            <a href="/admin/users?new=1" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg"></i> Tambah User</a>
          )}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Nama</th><th>Username</th><th>Role</th><th>Dibuat</th><th className="text-end">Aksi</th></tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Belum ada data.</td></tr>}
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td>{u.nama}</td>
                    <td>{u.username}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.createdAt.toLocaleString("id-ID")}</td>
                    <td className="text-end">
                      <a href={`/admin/users?edit=${u.id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-pencil"></i></a>
                      <ConfirmForm action={deleteUser.bind(null, u.id)} message={`Hapus user ${u.nama}?`} label="Hapus" icon="bi-trash" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white">
          <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/admin/users" />
        </div>
      </div>

      {showForm && (
        <div className="card shadow-sm" style={{ maxWidth: 640 }}>
          <div className="card-header bg-white"><h6 className="mb-0"><i className="bi bi-person"></i> {editUser ? "Edit User" : "Tambah User"}</h6></div>
          <div className="card-body">
            <form action={saveUser}>
              <input type="hidden" name="id" value={editUser?.id ?? ""} />
              <div className="mb-3">
                <label className="form-label">Nama Lengkap</label>
                <input type="text" name="nama" className="form-control" required defaultValue={editUser?.nama} />
              </div>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" name="username" className="form-control" required defaultValue={editUser?.username} />
              </div>
              <div className="mb-3">
                <label className="form-label">Password {editUser && <small className="text-muted">(kosongkan jika tidak diubah)</small>}</label>
                <input type="password" name="password" className="form-control" minLength={6} required={!editUser} />
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select name="role" className="form-select" defaultValue={editUser?.role ?? "peminjam"}>
                  <option value="admin">Admin</option>
                  <option value="petugas">Petugas</option>
                  <option value="peminjam">Peminjam</option>
                </select>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary"><i className="bi bi-save"></i> Simpan</button>
                <a href="/admin/users" className="btn btn-outline-secondary">Batal</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
