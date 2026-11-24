import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-ganti-di-produksi"
);

const ROLE_PREFIX: Record<string, string> = {
  admin: "/admin",
  petugas: "/petugas",
  peminjam: "/peminjam",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Halaman publik
  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("pa_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Batasi akses berdasarkan prefix role
    for (const [r, prefix] of Object.entries(ROLE_PREFIX)) {
      if (pathname.startsWith(prefix) && role !== r) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
