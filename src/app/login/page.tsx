import { loginAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <div className="bg-light d-flex align-items-center" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-box-seam text-primary" style={{ fontSize: "3rem" }}></i>
                  <h4 className="mt-2 mb-0">Sistem Peminjaman Alat</h4>
                  <small className="text-muted">UKK RPL Paket 1 — KM25.4.1.1</small>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form action={loginAction}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-person"></i></span>
                      <input type="text" name="username" className="form-control" required placeholder="Masukkan username" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-lock"></i></span>
                      <input type="password" name="password" className="form-control" required placeholder="Masukkan password" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-box-arrow-in-right"></i> Login
                  </button>
                </form>

                <div className="mt-4 p-3 bg-light rounded small text-muted">
                  <strong>Akun Demo:</strong><br />
                  Admin — admin / admin123<br />
                  Petugas — petugas / petugas123<br />
                  Peminjam — siswa / siswa123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
