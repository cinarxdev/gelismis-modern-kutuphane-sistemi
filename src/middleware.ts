import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "kutuphane_session";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/panel")) {
    return NextResponse.next();
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.redirect(new URL("/giris", req.url));
  }
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/giris", req.url));
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = String(payload.role ?? "");
    const path = req.nextUrl.pathname;
    if (role === "super_admin") {
      const blocked = [
        "/panel/kitap-ekle",
        "/panel/odunc-ver",
        "/panel/odunc-kayitlari",
        "/panel/kitaplar",
        "/panel/ogrenciler",
        "/panel/okul",
      ];
      if (blocked.some((b) => path === b || path.startsWith(`${b}/`))) {
        return NextResponse.redirect(new URL("/panel", req.url));
      }
    }
    if (role === "staff") {
      if (path.startsWith("/panel/yonetim") || path.startsWith("/panel/okul")) {
        return NextResponse.redirect(new URL("/panel", req.url));
      }
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/giris", req.url));
    res.cookies.delete(COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/panel/:path*"],
};
