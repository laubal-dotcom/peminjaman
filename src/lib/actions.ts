"use server";

import { prisma } from "@/lib/db";
import { createSession, destroySession, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============ AUTH ============

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    redirect("/login?error=" + encodeURIComponent("Username atau password salah"));
  }

  await createSession({
    id: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role as "admin" | "petugas" | "peminjam",
  });

  await prisma.logAktivitas.create({
    data: {
      userId: user.id,
      aksi: "Login",
      detail: `Pengguna ${user.username} (${user.role}) berhasil login`,
    },
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

async function requireRole(role: string) {
  const session = await getSession();
  if (!session || session.role !== role) redirect("/dashboard");
  return session;
}

async function logAktivitas(userId: number, aksi: string, detail: string) {
  await prisma.logAktivitas.create({ data: { userId, aksi, detail } });
}

// ============ ADMIN: USERS ============

export async function saveUser(formData: FormData) {
  await requireRole("admin");
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const nama = String(formData.get("nama") || "");
  const username = String(formData.get("username") || "");
  const role = String(formData.get("role") || "peminjam");
  const password = String(formData.get("password") || "");

  const dup = await prisma.user.findFirst({ where: { username, id: id ? { not: id } : undefined } });
  if (dup) redirect("/admin/users?error=" + encodeURIComponent("Username sudah digunakan"));

  if (id) {
    await prisma.user.update({
      where: { id },
      data: {
        nama, username, role,
        ...(password ? { password: bcrypt.hashSync(password, 10) } : {}),
      },
    });
  } else {
    if (!password) redirect("/admin/users?error=" + encodeURIComponent("Password wajib diisi"));
    await prisma.user.create({
      data: { nama, username, role, password: bcrypt.hashSync(password, 10) },
    });
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?success=Data user disimpan");
}

export async function deleteUser(id: number) {
  const session = await requireRole("admin");
  if (session.id === id) redirect("/admin/users?error=" + encodeURIComponent("Tidak dapat menghapus akun sendiri"));
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  redirect("/admin/users?success=User dihapus");
}

// ============ ADMIN: KATEGORI ============

export async function saveKategori(formData: FormData) {
  await requireRole("admin");
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const data = {
    nama: String(formData.get("nama") || ""),
    deskripsi: String(formData.get("deskripsi") || "") || null,
  };
  if (id) await prisma.kategori.update({ where: { id }, data });
  else await prisma.kategori.create({ data });
  revalidatePath("/admin/kategori");
  redirect("/admin/kategori?success=Kategori disimpan");
}

export async function deleteKategori(id: number) {
  await requireRole("admin");
  const count = await prisma.alat.count({ where: { kategoriId: id } });
  if (count > 0) redirect("/admin/kategori?error=" + encodeURIComponent("Kategori masih dipakai alat"));
  await prisma.kategori.delete({ where: { id } });
  revalidatePath("/admin/kategori");
  redirect("/admin/kategori?success=Kategori dihapus");
}

// ============ ADMIN: ALAT ============

export async function saveAlat(formData: FormData) {
  await requireRole("admin");
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const data = {
    kategoriId: Number(formData.get("kategori_id")),
    nama: String(formData.get("nama") || ""),
    kode: String(formData.get("kode") || "") || null,
    stok: Number(formData.get("stok") || 0),
    deskripsi: String(formData.get("deskripsi") || "") || null,
  };
  if (id) await prisma.alat.update({ where: { id }, data });
  else await prisma.alat.create({ data });
  revalidatePath("/admin/alat");
  redirect("/admin/alat?success=Alat disimpan");
}

export async function deleteAlat(id: number) {
  await requireRole("admin");
  const count = await prisma.detailPeminjaman.count({ where: { alatId: id } });
  if (count > 0) redirect("/admin/alat?error=" + encodeURIComponent("Alat punya riwayat peminjaman"));
  await prisma.alat.delete({ where: { id } });
  revalidatePath("/admin/alat");
  redirect("/admin/alat?success=Alat dihapus");
}

// ============ ADMIN: PEMINJAMAN ============

export async function savePeminjaman(formData: FormData) {
  await requireRole("admin");
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  if (id) {
    await prisma.peminjaman.update({
      where: { id },
      data: {
        status: String(formData.get("status") || "menunggu"),
        keterangan: String(formData.get("keterangan") || "") || null,
      },
    });
  } else {
    const alatIds = formData.getAll("alat_id[]").map(Number).filter(Boolean);
    const jumlahs = formData.getAll("jumlah[]").map(Number);
    const userId = Number(formData.get("user_id"));

    await prisma.$transaction(async (tx) => {
      const p = await tx.peminjaman.create({
        data: {
          userId,
          tglPinjam: new Date(String(formData.get("tgl_pinjam"))),
          tglKembali: new Date(String(formData.get("tgl_kembali"))),
          status: String(formData.get("status") || "menunggu"),
          keterangan: String(formData.get("keterangan") || "") || null,
        },
      });
      for (let i = 0; i < alatIds.length; i++) {
        if (alatIds[i] && jumlahs[i] > 0) {
          await tx.detailPeminjaman.create({
            data: { peminjamanId: p.id, alatId: alatIds[i], jumlah: jumlahs[i] },
          });
        }
      }
    });
  }
  revalidatePath("/admin/peminjaman");
  redirect("/admin/peminjaman?success=Peminjaman disimpan");
}

export async function deletePeminjaman(id: number) {
  await requireRole("admin");
  const p = await prisma.peminjaman.findUnique({ where: { id } });
  if (p && ["menunggu", "ditolak"].includes(p.status)) {
    await prisma.peminjaman.delete({ where: { id } });
  }
  revalidatePath("/admin/peminjaman");
  redirect("/admin/peminjaman?success=Peminjaman dihapus");
}

// ============ ADMIN: PENGEMBALIAN ============

export async function savePengembalian(formData: FormData) {
  const session = await requireRole("admin");
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const data = {
    peminjamanId: Number(formData.get("peminjaman_id")),
    petugasId: session.id,
    tglKembali: new Date(String(formData.get("tgl_kembali"))),
    denda: Number(formData.get("denda") || 0),
    kondisiAlat: String(formData.get("kondisi_alat") || "") || null,
    keterangan: String(formData.get("keterangan") || "") || null,
  };
  if (id) {
    const { peminjamanId, petugasId, ...rest } = data;
    await prisma.pengembalian.update({ where: { id }, data: rest });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.pengembalian.create({ data });
      await tx.peminjaman.update({
        where: { id: data.peminjamanId },
        data: { status: "selesai", tglKembaliAktual: data.tglKembali },
      });
      // Kembalikan stok
      const details = await tx.detailPeminjaman.findMany({ where: { peminjamanId: data.peminjamanId } });
      for (const d of details) {
        await tx.alat.update({ where: { id: d.alatId }, data: { stok: { increment: d.jumlah } } });
      }
    });
  }
  revalidatePath("/admin/pengembalian");
  redirect("/admin/pengembalian?success=Pengembalian disimpan");
}

export async function deletePengembalian(id: number) {
  await requireRole("admin");
  await prisma.pengembalian.delete({ where: { id } });
  revalidatePath("/admin/pengembalian");
  redirect("/admin/pengembalian?success=Pengembalian dihapus");
}

// ============ PETUGAS ============

export async function setujuiPeminjaman(id: number) {
  const session = await requireRole("petugas");
  const p = await prisma.peminjaman.findUnique({ where: { id }, include: { detailPeminjaman: true } });
  if (!p || p.status !== "menunggu") redirect("/petugas/persetujuan?error=Pengajuan tidak valid");

  // Cek stok
  for (const d of p.detailPeminjaman) {
    const alat = await prisma.alat.findUnique({ where: { id: d.alatId } });
    if (!alat || alat.stok < d.jumlah) {
      redirect("/petugas/persetujuan?error=" + encodeURIComponent(`Stok tidak cukup: ${alat?.nama ?? d.alatId}`));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.peminjaman.update({ where: { id }, data: { status: "dipinjam" } });
    for (const d of p.detailPeminjaman) {
      await tx.alat.update({ where: { id: d.alatId }, data: { stok: { decrement: d.jumlah } } });
    }
  });

  await logAktivitas(session.id, "Setujui peminjaman", `Pengajuan #${id} disetujui (dipinjam)`);
  revalidatePath("/petugas/persetujuan");
  redirect("/petugas/persetujuan?success=Peminjaman #" + id + " disetujui");
}

export async function tolakPeminjaman(id: number) {
  const session = await requireRole("petugas");
  const p = await prisma.peminjaman.findUnique({ where: { id } });
  if (!p || p.status !== "menunggu") redirect("/petugas/persetujuan?error=Pengajuan tidak valid");

  await prisma.peminjaman.update({
    where: { id },
    data: { status: "ditolak", keterangan: (p.keterangan ?? "") + " [DITOLAK]" },
  });
  await logAktivitas(session.id, "Tolak peminjaman", `Pengajuan #${id} ditolak`);
  revalidatePath("/petugas/persetujuan");
  redirect("/petugas/persetujuan?success=Peminjaman #" + id + " ditolak");
}

/** Hitung denda: Rp2.000 per hari keterlambatan (pengganti fn_hitung_denda) */
function hitungDenda(tglRencana: Date, tglAktual: Date): number {
  const diff = Math.floor((tglAktual.getTime() - tglRencana.getTime()) / 86400000);
  return diff > 0 ? diff * 2000 : 0;
}

export async function konfirmasiPengembalian(id: number, formData: FormData) {
  const session = await requireRole("petugas");
  const p = await prisma.peminjaman.findUnique({ where: { id } });
  if (!p || !["dipinjam", "proses_kembali"].includes(p.status)) {
    redirect("/petugas/pengembalian?error=Peminjaman tidak valid");
  }

  const tglBalik = new Date(String(formData.get("tgl_kembali") || new Date().toISOString().slice(0, 10)));
  const denda = hitungDenda(p.tglKembali, tglBalik);

  await prisma.$transaction(async (tx) => {
    await tx.pengembalian.create({
      data: {
        peminjamanId: id,
        petugasId: session.id,
        tglKembali: tglBalik,
        denda,
        kondisiAlat: String(formData.get("kondisi_alat") || "") || null,
        keterangan: String(formData.get("keterangan") || "") || null,
      },
    });
    await tx.peminjaman.update({
      where: { id },
      data: { status: "selesai", tglKembaliAktual: tglBalik },
    });
    const details = await tx.detailPeminjaman.findMany({ where: { peminjamanId: id } });
    for (const d of details) {
      await tx.alat.update({ where: { id: d.alatId }, data: { stok: { increment: d.jumlah } } });
    }
  });

  await logAktivitas(session.id, "Konfirmasi pengembalian", `Peminjaman #${id} selesai, denda Rp ${denda.toLocaleString("id-ID")}`);
  revalidatePath("/petugas/pengembalian");
  redirect("/petugas/pengembalian?success=Pengembalian #" + id + " dikonfirmasi, denda Rp " + denda.toLocaleString("id-ID"));
}

// ============ PEMINJAM ============

export async function ajukanPeminjaman(formData: FormData) {
  const session = await requireRole("peminjam");
  const alatIds = formData.getAll("alat_id[]").map(Number).filter(Boolean);
  const jumlahs = formData.getAll("jumlah[]").map(Number);
  const tglPinjam = new Date(String(formData.get("tgl_pinjam")));
  const tglKembali = new Date(String(formData.get("tgl_kembali")));

  if (alatIds.length === 0 || tglKembali <= tglPinjam) {
    redirect("/peminjam/pinjam?error=" + encodeURIComponent("Data tidak valid"));
  }

  // Validasi stok
  for (let i = 0; i < alatIds.length; i++) {
    const alat = await prisma.alat.findUnique({ where: { id: alatIds[i] } });
    if (!alat || alat.stok < (jumlahs[i] || 0)) {
      redirect("/peminjam/pinjam?error=" + encodeURIComponent(`Stok tidak cukup: ${alat?.nama ?? alatIds[i]}`));
    }
  }

  await prisma.$transaction(async (tx) => {
    const p = await tx.peminjaman.create({
      data: {
        userId: session.id,
        tglPinjam,
        tglKembali,
        status: "menunggu",
        keterangan: String(formData.get("keterangan") || "") || null,
      },
    });
    for (let i = 0; i < alatIds.length; i++) {
      if (jumlahs[i] > 0) {
        await tx.detailPeminjaman.create({
          data: { peminjamanId: p.id, alatId: alatIds[i], jumlah: jumlahs[i] },
        });
      }
    }
    await tx.logAktivitas.create({
      data: { userId: session.id, aksi: "Peminjaman dibuat", detail: `Pengajuan #${p.id} menunggu persetujuan` },
    });
  });

  revalidatePath("/peminjam/pinjam");
  redirect("/peminjam/pinjam?success=Pengajuan berhasil dikirim");
}

export async function ajukanKembali(id: number) {
  const session = await requireRole("peminjam");
  const p = await prisma.peminjaman.findFirst({ where: { id, userId: session.id } });
  if (!p || p.status !== "dipinjam") redirect("/peminjam/kembali?error=Tidak dapat diajukan");

  await prisma.peminjaman.update({ where: { id }, data: { status: "proses_kembali" } });
  await logAktivitas(session.id, "Ajukan pengembalian", `Peminjaman #${id} diajukan kembali`);
  revalidatePath("/peminjam/kembali");
  redirect("/peminjam/kembali?success=Pengajuan pengembalian terkirim");
}
