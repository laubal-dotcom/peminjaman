import { prisma } from "@/lib/db";

export default async function PeminjamAlatPage() {
  const alats = await prisma.alat.findMany({
    include: { kategori: true },
    orderBy: { nama: "asc" },
  });

  return (
    <div className="row g-3">
      {alats.map((a) => (
        <div className="col-12 col-md-6 col-lg-4" key={a.id}>
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{a.nama}</h6>
                  <small className="text-muted"><i className="bi bi-tag"></i> {a.kategori.nama}</small>
                  {a.kode && <><br /><code className="small">{a.kode}</code></>}
                </div>
                {a.stok > 0 ? <span className="badge bg-success fs-6">{a.stok}</span> : <span className="badge bg-danger fs-6">Habis</span>}
              </div>
              <p className="text-muted small mt-2 mb-0">{a.deskripsi ?? "Tidak ada deskripsi."}</p>
            </div>
            <div className="card-footer bg-white small text-muted">
              Stok tersedia: <strong>{a.stok}</strong> unit
            </div>
          </div>
        </div>
      ))}
      {alats.length === 0 && <div className="col-12"><div className="alert alert-info">Belum ada alat terdaftar.</div></div>}
    </div>
  );
}
