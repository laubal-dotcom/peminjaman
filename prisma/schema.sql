-- Schema generated manually from prisma/schema.prisma
-- (prisma db push blocked by Device Guard on this machine)

CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

CREATE TABLE IF NOT EXISTS "kategori" (
    "id" SERIAL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "alat" (
    "id" SERIAL PRIMARY KEY,
    "kategori_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alat_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "alat_kode_key" ON "alat"("kode");

CREATE TABLE IF NOT EXISTS "peminjaman" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "tgl_pinjam" DATE NOT NULL,
    "tgl_kembali" DATE NOT NULL,
    "tgl_kembali_aktual" DATE,
    "status" TEXT NOT NULL DEFAULT 'menunggu',
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "peminjaman_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "detail_peminjaman" (
    "id" SERIAL PRIMARY KEY,
    "peminjaman_id" INTEGER NOT NULL,
    "alat_id" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    CONSTRAINT "detail_peminjaman_peminjaman_id_fkey" FOREIGN KEY ("peminjaman_id") REFERENCES "peminjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "detail_peminjaman_alat_id_fkey" FOREIGN KEY ("alat_id") REFERENCES "alat"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "pengembalian" (
    "id" SERIAL PRIMARY KEY,
    "peminjaman_id" INTEGER NOT NULL,
    "petugas_id" INTEGER,
    "tgl_kembali" DATE NOT NULL,
    "denda" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "kondisi_alat" TEXT,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pengembalian_peminjaman_id_fkey" FOREIGN KEY ("peminjaman_id") REFERENCES "peminjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengembalian_petugas_id_fkey" FOREIGN KEY ("petugas_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "log_aktivitas" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER,
    "aksi" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "log_aktivitas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
