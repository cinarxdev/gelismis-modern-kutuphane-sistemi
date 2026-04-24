import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Student } from "@/models/Student";
import { logActivity } from "@/lib/activity";

const patchSchema = z.object({
  fullName: z.string().min(1).optional(),
  studentNo: z.string().optional().nullable(),
  gradeClass: z.string().optional().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
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
  const s = await Student.findOne({ _id: id, schoolId: auth.user.schoolId });
  if (!s) {
    return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
  }
  if (body.fullName !== undefined) s.fullName = body.fullName.trim();
  if (body.studentNo !== undefined) s.studentNo = body.studentNo?.trim() || null;
  if (body.gradeClass !== undefined) s.gradeClass = body.gradeClass?.trim() || null;
  await s.save();
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Öğrenci güncellendi",
    detail: s.fullName,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { id } = await ctx.params;
  const s = await Student.findOne({ _id: id, schoolId: auth.user.schoolId });
  if (!s) {
    return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
  }
  await s.deleteOne();
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Öğrenci silindi",
    detail: s.fullName,
  });
  return NextResponse.json({ ok: true });
}
