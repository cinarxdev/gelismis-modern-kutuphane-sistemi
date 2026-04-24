import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { School } from "@/models/School";
import { verifyPassword } from "@/lib/password";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    await connectDB();
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const { username, password } = parsed.data;
    const user = await User.findOne({
      username: username.trim(),
      isActive: true,
    });
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }

    user.lastLogin = new Date();
    await user.save();
    console.log(`[Login] ${user.username} - lastLogin updated:`, user.lastLogin);
    let schoolName: string | null = null;
    if (user.schoolId) {
      const school = await School.findOne({ _id: user.schoolId }).select("name").lean();
      if (school && typeof school === "object" && "name" in school) {
        schoolName = String((school as unknown as { name: string }).name);
      }
    }
    const payload = {
      sub: String(user._id),
      username: user.username,
      role: user.role,
      schoolId: user.schoolId ? String(user.schoolId) : null,
      schoolName,
    };
    const token = await signSessionToken(payload);
    await setSessionCookie(token);
    await logActivity({
      schoolId: user.schoolId,
      userId: user._id,
      username: user.username,
      role: user.role,
      action: "Giriş yapıldı",
    });
    return NextResponse.json({
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        schoolId: payload.schoolId,
        schoolName,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
