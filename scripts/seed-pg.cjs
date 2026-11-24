// Seed database Neon langsung via pg (Prisma engine diblokir Device Guard di mesin ini)
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const url = fs.readFileSync('.env', 'utf8').match(/DATABASE_URL="([^"]+)"/)[1];
const hash = (p) => bcrypt.hashSync(p, 10);

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const users = [
    ['Administrator', 'admin', hash('admin123'), 'admin'],
    ['Budi Petugas', 'petugas', hash('petugas123'), 'petugas'],
    ['Siswa RPL', 'siswa', hash('siswa123'), 'peminjam'],
  ];
  const userIds = {};
  for (const [nama, username, password, role] of users) {
    const r = await c.query(
      `INSERT INTO users (nama, username, password, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (username) DO UPDATE SET nama=EXCLUDED.nama RETURNING id`,
      [nama, username, password, role]
    );
    userIds[username] = r.rows[0].id;
  }

  await c.query(
    `INSERT INTO kategori (id, nama, deskripsi) VALUES
      (1, 'Peralatan Elektronik', 'Alat-alat elektronik seperti laptop, proyektor, dan kamera'),
      (2, 'Peralatan Bengkel', 'Alat perkakas dan perbengkelan')
     ON CONFLICT (id) DO NOTHING`
  );

  const alatData = [
    [1, 'Laptop Lenovo ThinkPad', 'LT-001', 5, 'Laptop untuk keperluan presentasi dan praktikum'],
    [1, 'Proyektor Epson', 'PJ-002', 3, 'Proyektor LCD untuk ruang kelas'],
    [1, 'Kamera DSLR', 'CM-003', 2, 'Kamera dokumentasi kegiatan sekolah'],
    [2, 'Bor Listrik', 'BR-004', 10, 'Bor listrik 500W untuk praktik teknik'],
  ];
  const alatIds = {};
  for (const [kategoriId, nama, kode, stok, deskripsi] of alatData) {
    const r = await c.query(
      `INSERT INTO alat (kategori_id, nama, kode, stok, deskripsi) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (kode) DO UPDATE SET nama=EXCLUDED.nama RETURNING id`,
      [kategoriId, nama, kode, stok, deskripsi]
    );
    alatIds[kode] = r.rows[0].id;
  }

  const cnt = await c.query('SELECT COUNT(*)::int AS n FROM peminjaman WHERE user_id = $1', [userIds.siswa]);
  if (cnt.rows[0].n === 0) {
    const today = new Date();
    const kembali = new Date(today.getTime() + 3 * 86400000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const p = await c.query(
      `INSERT INTO peminjaman (user_id, tgl_pinjam, tgl_kembali, status, keterangan)
       VALUES ($1,$2,$3,'menunggu','Untuk presentasi tugas') RETURNING id`,
      [userIds.siswa, fmt(today), fmt(kembali)]
    );
    await c.query(
      `INSERT INTO detail_peminjaman (peminjaman_id, alat_id, jumlah) VALUES ($1,$2,1)`,
      [p.rows[0].id, alatIds['LT-001']]
    );
    await c.query(
      `INSERT INTO log_aktivitas (user_id, aksi, detail) VALUES ($1,'Peminjaman dibuat',$2)`,
      [userIds.siswa, `Pengajuan peminjaman #${p.rows[0].id} menunggu persetujuan`]
    );
  }

  console.log('Seed selesai. Login: admin/admin123, petugas/petugas123, siswa/siswa123');
  await c.end();
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
