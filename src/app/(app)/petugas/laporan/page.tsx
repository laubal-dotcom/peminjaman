import { prisma } from "@/lib/db";
import { Alerts } from "@/components/Alerts";
import PrintButton from "@/components/PrintButton";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tgl_awal?: string; tgl_akhir?: string; cari?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const awal = sp.tgl_awal || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const akhir = sp.tgl_akhir || new Date().toISOString().slice(0, 10);
  const cari = sp.cari === "1";

  let rows: any[] = [];
  if (cari) {
    const data = await prisma.peminjaman.findMany({
      where: {
        tglPinjam: {
          gte: new Date(awal),
          lte: new Date(akhir + "T23:59:59"),
        },
      },
      include: {
        user: true,
        detailPeminjaman: { include: { alat: true } },
        pengembalian: { orderBy: { id: "desc" }, take: 1 },
      },
      orderBy: { id: "asc" },
    });
    rows = data.flatMap((p) =>
      p.detailPeminjaman.map((d) => {
        const pg = p.pengembalian[0];
        return {
          idPeminjaman: p.id,
          peminjam: p.user.nama,
          tglPinjam: p.tglPinjam,
          tglKembaliRencana: p.tglKembali,
          tglKembaliAktual: p.tglKembaliAktual,
          status: p.status,
          alat: d.alat.nama,
          kodeAlat: d.alat.kode,
          jumlah: d.jumlah,
          tglPengembalian: pg?.tglKembali,
          denda: pg ? Number(pg.denda) : 0,
        };
      })
    );
  }

  const fmt = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "-");
  const totalDenda = rows.reduce((s, r) => s + r.denda, 0);

  return (
    <>
      <Alerts searchParams={sp} />
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <form method="get" className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Tanggal Mulai</label>
              <input type="date" name="tgl_awal" className="form-control" defaultValue={awal} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Tanggal Selesai</label>
              <input type="date" name="tgl_akhir" className="form-control" defaultValue={akhir} required />
            </div>
            <div className="col-md-4">
              <input type="hidden" name="cari" value="1" />
              <button type="submit" className="btn btn-primary"><i className="bi bi-search"></i> Tampilkan Laporan</button>
              {cari && <PrintButton />}
            </div>
          </form>
        </div>
      </div>

      {cari && rows.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="bi bi-file-earmark-bar-graph"></i> Laporan {awal} s/d {akhir}</h6>
            <span className="badge bg-secondary">{rows.length} baris</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr><th>ID Pinjam</th><th>Peminjam</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Kembali Aktual</th><th>Alat</th><th>Jumlah</th><th>Status</th><th>Denda</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>#{r.idPeminjaman}</td>
                      <td>{r.peminjam}</td>
                      <td>{fmt(r.tglPinjam)}</td>
                      <td>{fmt(r.tglKembaliRencana)}</td>
                      <td>{fmt(r.tglKembaliAktual)}</td>
                      <td>{r.alat} <small className="text-muted">({r.kodeAlat ?? "-"})</small></td>
                      <td>x{r.jumlah}</td>
                      <td><span className="badge bg-secondary">{r.status}</span></td>
                      <td>{r.denda > 0 ? <span className="text-danger fw-bold">Rp {r.denda.toLocaleString("id-ID")}</span> : "Rp 0"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr><td colSpan={8} className="text-end">Total Denda:</td><td>Rp {totalDenda.toLocaleString("id-ID")}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
      {cari && rows.length === 0 && <div className="alert alert-info">Tidak ada data laporan pada rentang tanggal tersebut.</div>}
    </>
  );
}
