import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Users
  const hash = (p: string) => bcrypt.hashSync(p, 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { nama: "Administrator", username: "admin", password: hash("admin123"), role: "admin" },
  });
  await prisma.user.upsert({
    where: { username: "petugas" },
    update: {},
    create: { nama: "Budi Petugas", username: "petugas", password: hash("petugas123"), role: "petugas" },
  });
  const siswa = await prisma.user.upsert({
    where: { username: "siswa" },
    update: {},
    create: { nama: "Siswa RPL", username: "siswa", password: hash("siswa123"), role: "peminjam" },
  });

  // Kategori
  const k1 = await prisma.kategori.upsert({
    where: { id: 1 }, update: {},
    create: { nama: "Peralatan Elektronik", deskripsi: "Alat-alat elektronik seperti laptop, proyektor, dan kamera" },
  });
  await prisma.kategori.upsert({
    where: { id: 2 }, update: {},
    create: { nama: "Peralatan Bengkel", deskripsi: "Alat perkakas dan perbengkelan" },
  });

  // Alat
  const alatData = [
    { kategoriId: k1.id, nama: "Laptop Lenovo ThinkPad", kode: "LT-001", stok: 5, deskripsi: "Laptop untuk keperluan presentasi dan praktikum" },
    { kategoriId: k1.id, nama: "Proyektor Epson", kode: "PJ-002", stok: 3, deskripsi: "Proyektor LCD untuk ruang kelas" },
    { kategoriId: k1.id, nama: "Kamera DSLR", kode: "CM-003", stok: 2, deskripsi: "Kamera dokumentasi kegiatan sekolah" },
    { kategoriId: 2, nama: "Bor Listrik", kode: "BR-004", stok: 10, deskripsi: "Bor listrik 500W untuk praktik teknik" },
  ];
  for (const a of alatData) {
    await prisma.alat.upsert({
      where: { kode: a.kode }, update: {}, create: a,
    });
  }

  // Contoh peminjaman menunggu
  const ada = await prisma.peminjaman.count({ where: { userId: siswa.id } });
  if (ada === 0) {
    const laptop = await prisma.alat.findFirst({ where: { kode: "LT-001" } });
    const today = new Date();
    const kembali = new Date(today.getTime() + 3 * 86400000);
    const p = await prisma.peminjaman.create({
      data: {
        userId: siswa.id,
        tglPinjam: today,
        tglKembali: kembali,
        status: "menunggu",
        keterangan: "Untuk presentasi tugas",
        detailPeminjaman: laptop ? { create: [{ alatId: laptop.id, jumlah: 1 }] } : undefined,
      },
    });
    await prisma.logAktivitas.create({
      data: { userId: siswa.id, aksi: "Peminjaman dibuat", detail: `Pengajuan peminjaman #${p.id} menunggu persetujuan` },
    });
  }

  console.log("Seed selesai. Login: admin/admin123, petugas/petugas123, siswa/siswa123");
}

main().finally(() => prisma.$disconnect());
