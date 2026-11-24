import { prisma } from "@/lib/db";
import { setujuiPeminjaman, tolakPeminjaman } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import ConfirmForm from "@/components/ConfirmForm";

const PER_PAGE = 10;

export default async function PersetujuanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [total, peminjaman] = await Promise.all([
    prisma.peminjaman.count({ where: { status: "menunggu" } }),
    prisma.peminjaman.findMany({
      where: { status: "menunggu" },
      include: { user: true, detailPeminjaman: { include: { alat: true } } },
      orderBy: { id: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="card shadow-sm">
      <Alerts searchParams={sp} />
      <div className="card-header bg-white">
        <h6 className="mb-0"><i className="bi bi-check2-square"></i> Persetujuan Peminjaman</h6>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr><th>#</th><th>Peminjam</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Alat</th><th>Keterangan</th><th className="text-end">Aksi</th></tr>
            </thead>
            <tbody>
              {peminjaman.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Tidak ada pengajuan yang menunggu.</td></tr>}
              {peminjaman.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.user.nama} <small className="text-muted">({p.user.username})</small></td>
                  <td>{fmt(p.tglPinjam)}</td>
                  <td>{fmt(p.tglKembali)}</td>
                  <td className="small">{p.detailPeminjaman.map((d) => `${d.alat.nama} (x${d.jumlah})`).join(", ")}</td>
                  <td className="small">{p.keterangan ?? "-"}</td>
                  <td className="text-end text-nowrap">
                    <ConfirmForm action={setujuiPeminjaman.bind(null, p.id)} message={`Setujui pengajuan #${p.id}? Stok akan berkurang.`} label="ACC" icon="bi-check-lg" className="btn-success" />{" "}
                    <ConfirmForm action={tolakPeminjaman.bind(null, p.id)} message={`Tolak pengajuan #${p.id}?`} label="Tolak" icon="bi-x-lg" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer bg-white">
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} basePath="/petugas/persetujuan" />
      </div>
    </div>
  );
}
