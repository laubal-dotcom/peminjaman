import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ajukanPeminjaman } from "@/lib/actions";
import { Alerts } from "@/components/Alerts";
import { StatusBadge } from "@/components/StatusBadge";
import AlatRows from "@/components/AlatRows";

export default async function PinjamPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const [alats, riwayat] = await Promise.all([
    prisma.alat.findMany({ where: { stok: { gt: 0 } }, orderBy: { nama: "asc" } }),
    prisma.peminjaman.findMany({
      where: { userId: session!.id },
      include: { detailPeminjaman: { include: { alat: true } } },
      orderBy: { id: "desc" },
    }),
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = fmt(new Date());
  const plus3 = fmt(new Date(Date.now() + 3 * 86400000));

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <h6 className="mb-0"><i className="bi bi-box-arrow-up-right"></i> Form Pengajuan Peminjaman</h6>
        </div>
        <div className="card-body">
          <form action={ajukanPeminjaman}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Tanggal Pinjam</label>
                <input type="date" name="tgl_pinjam" className="form-control" required defaultValue={today} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Tanggal Kembali (Rencana)</label>
                <input type="date" name="tgl_kembali" className="form-control" required defaultValue={plus3} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Keterangan / Keperluan</label>
              <textarea name="keterangan" className="form-control" rows={2} placeholder="Contoh: Untuk praktikum / presentasi..."></textarea>
            </div>
            <h6 className="mt-2"><i className="bi bi-tools"></i> Pilih Alat</h6>
            <AlatRows alats={alats} />
            <div className="mt-3">
              <button type="submit" className="btn btn-primary"><i className="bi bi-send"></i> Ajukan Peminjaman</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h6 className="mb-0"><i className="bi bi-clock-history"></i> Riwayat Pengajuan Saya</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Alat</th><th>Status</th></tr>
              </thead>
              <tbody>
                {riwayat.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">Belum ada riwayat.</td></tr>}
                {riwayat.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{fmt(r.tglPinjam)}</td>
                    <td>{fmt(r.tglKembali)}</td>
                    <td className="small">{r.detailPeminjaman.map((d) => `${d.alat.nama} (x${d.jumlah})`).join(", ")}</td>
                    <td><StatusBadge status={r.status} /></td>
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
