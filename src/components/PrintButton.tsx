"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => window.print()}>
      <i className="bi bi-printer"></i> Cetak
    </button>
  );
}
