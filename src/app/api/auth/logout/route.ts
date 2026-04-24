import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { logActivity } from "@/lib/activity";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await connectDB();
      await logActivity({
        schoolId: session.schoolId,
        userId: session.sub,
        username: session.username,
        role: session.role,
        action: "Çıkış yapıldı",
      });
    }
  } catch {}
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
