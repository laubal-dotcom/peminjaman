export function Alerts({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const success = typeof searchParams.success === "string" ? searchParams.success : null;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  if (!success && !error) return null;
  return (
    <>
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle"></i> {success}
          <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="bi bi-exclamation-triangle"></i> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
        </div>
      )}
    </>
  );
}
