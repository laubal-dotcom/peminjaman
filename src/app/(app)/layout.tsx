import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SidebarToggle from "@/components/SidebarToggle";
import { logoutAction } from "@/lib/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Sidebar role={session.role} />
      <div className="main-content">
        <div className="topbar">
          <div className="d-flex align-items-center gap-2">
            <SidebarToggle />
            <h5 className="mb-0">Sistem Peminjaman Alat</h5>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-primary text-capitalize">{session.role}</span>
            <div className="dropdown">
              <a
                href="#"
                className="d-flex align-items-center text-decoration-none text-dark dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle fs-4 me-1"></i>
                <span className="d-none d-sm-inline">{session.nama}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><span className="dropdown-item-text small text-muted">{session.username}</span></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <form action={logoutAction}>
                    <button type="submit" className="dropdown-item text-danger">
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container-fluid p-3 p-md-4">{children}</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" defer />
    </>
  );
}
