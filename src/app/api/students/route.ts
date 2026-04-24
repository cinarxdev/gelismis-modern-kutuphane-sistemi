import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Student } from "@/models/Student";
import { logActivity } from "@/lib/activity";

const createSchema = z.object({
  fullName: z.string().min(1),
  studentNo: z.string().optional().nullable(),
  gradeClass: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const filter: Record<string, unknown> = { schoolId: auth.user.schoolId };
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { studentNo: q },
    ];
  }
  const students = await Student.find(filter).sort({ fullName: 1 }).limit(500).lean();
  return NextResponse.json({
    students: students.map((s) => ({
      id: String(s._id),
      fullName: s.fullName,
      studentNo: s.studentNo,
      gradeClass: s.gradeClass,
      lostBooksCount: Number((s as { lostBooksCount?: number }).lostBooksCount ?? 0),
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
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
  const s = await Student.create({
    schoolId: auth.user.schoolId,
    fullName: body.fullName.trim(),
    studentNo: body.studentNo?.trim() || null,
    gradeClass: body.gradeClass?.trim() || null,
  });
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Öğrenci eklendi",
    detail: s.fullName,
  });
  return NextResponse.json({
    student: {
      id: String(s._id),
      fullName: s.fullName,
      studentNo: s.studentNo,
      gradeClass: s.gradeClass,
    },
  });
}
