import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchoolAdmin } from "@/lib/api-auth";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";

const patchSchema = z.object({
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchoolAdmin(auth.user);
  if (deny) return deny;
  const { id } = await ctx.params;
  let body: z.infer<typeof patchSchema>;
  try {
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }
  const user = await User.findOne({
    _id: id,
    schoolId: auth.user.schoolId,
    role: "staff",
  });
  if (!user) {
    return NextResponse.json({ error: "Görevli bulunamadı" }, { status: 404 });
  }
  if (body.password) {
    user.passwordHash = await hashPassword(body.password);
  }
  if (body.isActive !== undefined) {
    user.isActive = body.isActive;
  }
  await user.save();
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Görevli güncellendi",
    detail: user.username,
    meta: { passwordChanged: Boolean(body.password), isActive: user.isActive },
  });
  return NextResponse.json({ ok: true });
}
