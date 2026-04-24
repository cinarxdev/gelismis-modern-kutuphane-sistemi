import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { UserRole } from "@/models/User";
import { NextResponse } from "next/server";

export type AuthedUser = {
  id: string;
  username: string;
  role: UserRole;
  schoolId: string | null;
};

export async function requireAuth(): Promise<
  { ok: true; user: AuthedUser } | { ok: false; res: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }) };
  }
  await connectDB();
  const doc = await User.findById(session.sub);
  if (!doc || !doc.isActive) {
    return { ok: false, res: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }) };
  }
  return {
    ok: true,
    user: {
      id: String(doc._id),
      username: doc.username,
      role: doc.role,
      schoolId: doc.schoolId ? String(doc.schoolId) : null,
    },
  };
}

export function requireSuper(
  u: AuthedUser
): NextResponse | null {
  if (u.role !== "super_admin") {
    return NextResponse.json({ error: "Sadece platform yöneticisi" }, { status: 403 });
  }
  return null;
}

export function requireSchool(
  u: AuthedUser
): NextResponse | null {
  if (!u.schoolId || (u.role !== "school_admin" && u.role !== "staff")) {
    return NextResponse.json({ error: "Okul hesabı gerekli" }, { status: 403 });
  }
  return null;
}

export function requireSchoolAdmin(
  u: AuthedUser
): NextResponse | null {
  if (u.role !== "school_admin" || !u.schoolId) {
    return NextResponse.json({ error: "Sadece okul yöneticisi" }, { status: 403 });
  }
  return null;
}
