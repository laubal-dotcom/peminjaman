"use client";

import { useState } from "react";

type Alat = { id: number; nama: string; stok: number };

export default function AlatRows({ alats, initial }: { alats: Alat[]; initial?: { alatId: number; jumlah: number }[] }) {
  const [rows, setRows] = useState<{ alatId: number; jumlah: number }[]>(
    initial && initial.length ? initial : [{ alatId: 0, jumlah: 1 }]
  );

  const update = (i: number, field: "alatId" | "jumlah", value: number) => {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  return (
    <div>
      {rows.map((r, i) => (
        <div className="row g-2 mb-2" key={i}>
          <div className="col-md-8">
            <select
              name="alat_id[]"
              className="form-select"
              value={r.alatId || ""}
              onChange={(e) => update(i, "alatId", Number(e.target.value))}
              required
            >
              <option value="">-- Pilih Alat --</option>
              {alats.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} (stok: {a.stok})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="number"
              name="jumlah[]"
              className="form-control"
              min={1}
              value={r.jumlah}
              onChange={(e) => update(i, "jumlah", Number(e.target.value))}
              required
            />
          </div>
          <div className="col-md-1">
            <button
              type="button"
              className="btn btn-outline-danger w-100"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              disabled={rows.length === 1}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        onClick={() => setRows([...rows, { alatId: 0, jumlah: 1 }])}
      >
        <i className="bi bi-plus-lg"></i> Tambah Alat
      </button>
    </div>
  );
}
