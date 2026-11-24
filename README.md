# Sistem Peminjaman Alat — Next.js

Migrasi dari CodeIgniter 4 ke **Next.js 15 (App Router, TypeScript) + Prisma + PostgreSQL**.
Aplikasi Sistem Peminjaman Alat untuk UKK RPL Paket 1 (KM25.4.1.1).

## Fitur (setara versi CI4)

- Login/logout dengan JWT session cookie, proteksi role via middleware
- **Admin**: CRUD User, Kategori, Alat & Stok, Peminjaman, Pengembalian, Log Aktivitas (pagination)
- **Petugas**: Persetujuan pinjaman (stok berkurang otomatis dalam transaksi), verifikasi pengembalian dengan **denda otomatis Rp2.000/hari**, Laporan dengan filter tanggal + tombol cetak
- **Peminjam**: Katalog alat, pengajuan peminjaman (multi-alat, validasi stok), pengajuan pengembalian (`dipinjam` → `proses_kembali`)

> Catatan migrasi: trigger `trg_kurangi_stok`/`trg_tambah_stok`, function `fn_hitung_denda`, dan stored procedure `sp_laporan_peminjaman` diimplementasikan ulang sebagai logika transaksi di Server Actions (`src/lib/actions.ts`) — hasil fungsionalnya identik.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Database PostgreSQL gratis

Paling mudah: **Supabase** (https://supabase.com) atau **Neon** (https://neon.tech).

1. Buat project → ambil connection string `postgresql://...`
2. Copy `.env.example` → `.env`, isi:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
AUTH_SECRET="string-acak-panjang-anda"
```

### 3. Push schema & seed data

```bash
npx prisma db push
npm run db:seed
```

Akun demo: `admin/admin123`, `petugas/petugas123`, `siswa/siswa123`

### 4. Jalankan

```bash
npm run dev     # dev server http://localhost:3000
npm run build && npm start   # production
```

## Deploy ke Vercel (gratis, online 24/7)

1. Push repo ini ke GitHub
2. Buka https://vercel.com → **Add New Project** → import repo
3. Di Environment Variables isi `DATABASE_URL` dan `AUTH_SECRET`
4. Deploy — selesai, dapat URL `https://xxx.vercel.app`

## Struktur

```
src/
  app/
    (app)/            # halaman terproteksi (layout sidebar + topbar)
      dashboard/
      admin/          # users, kategori, alat, peminjaman, pengembalian, log-aktivitas
      petugas/        # persetujuan, pengembalian, laporan
      peminjam/       # alat, pinjam, kembali
    login/
  components/         # Sidebar, StatusBadge, Alerts, AlatRows, ConfirmForm, Pagination
  lib/
    auth.ts           # JWT session (jose)
    actions.ts        # semua Server Actions (mutasi data + transaksi)
    db.ts             # Prisma client
prisma/
  schema.prisma
  seed.ts
```
