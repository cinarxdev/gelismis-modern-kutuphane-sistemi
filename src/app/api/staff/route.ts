import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchoolAdmin } from "@/lib/api-auth";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";

const createSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
});

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchoolAdmin(auth.user);
  if (deny) return deny;
  const users = await User.find({
    schoolId: auth.user.schoolId,
    role: "staff",
  })
    .select("username isActive createdAt lastLogin")
    .sort({ createdAt: -1 })
    .lean();
  type StaffRow = {
    _id: unknown;
    username: string;
    isActive?: boolean;
    createdAt?: Date;
    lastLogin?: Date | null;
  };
  return NextResponse.json({
    staff: (users as unknown as StaffRow[]).map((u) => ({
      id: String(u._id),
      username: u.username,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchoolAdmin(auth.user);
  if (deny) return deny;
  let body: z.infer<typeof createSchema>;
  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const username = body.username.trim();
  try {
    const passwordHash = await hashPassword(body.password);
    const u = await User.create({
      username,
      email: null,
      passwordHash,
      role: "staff",
      schoolId: auth.user.schoolId,
      isActive: true,
    });
    await logActivity({
      schoolId: auth.user.schoolId,
      userId: auth.user.id,
      username: auth.user.username,
      role: auth.user.role,
      action: "Görevli oluşturuldu",
      detail: username,
    });
    return NextResponse.json({
      staff: { id: String(u._id), username: u.username },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Bu kullanıcı adı bu okulda kullanılıyor" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
