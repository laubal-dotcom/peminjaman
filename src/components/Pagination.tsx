import Link from "next/link";

export function Pagination({ page, totalPages, basePath, params = {} }: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;
  const mk = (p: number) => {
    const sp = new URLSearchParams({ ...params, page: String(p) });
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <nav className="d-flex justify-content-center mt-3">
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item${page <= 1 ? " disabled" : ""}`}>
          <Link className="page-link" href={mk(page - 1)}>Prev</Link>
        </li>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <li key={p} className={`page-item${p === page ? " active" : ""}`}>
            <Link className="page-link" href={mk(p)}>{p}</Link>
          </li>
        ))}
        <li className={`page-item${page >= totalPages ? " disabled" : ""}`}>
          <Link className="page-link" href={mk(page + 1)}>Next</Link>
        </li>
      </ul>
    </nav>
  );
}
