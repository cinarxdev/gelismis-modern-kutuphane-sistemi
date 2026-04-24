import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/models/User";

const COOKIE = "kutuphane_session";
const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET en az 32 karakter olmalı");
  }
  return new TextEncoder().encode(s);
};

export type SessionPayload = {
  sub: string;
  username: string;
  role: UserRole;
  schoolId: string | null;
  schoolName: string | null;
};

export async function signSessionToken(payload: SessionPayload, maxAgeSec = 60 * 60 * 24 * 7) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = String(payload.sub ?? "");
    const username = String(payload.username ?? "");
    const role = payload.role as UserRole;
    const schoolId = payload.schoolId != null ? String(payload.schoolId) : null;
    const schoolName = payload.schoolName != null ? String(payload.schoolName) : null;
    if (!sub || !username || !role) return null;
    return { sub, username, role, schoolId, schoolName };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, maxAgeSec = 60 * 60 * 24 * 7) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeSec,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { COOKIE };
