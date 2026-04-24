import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSuper } from "@/lib/api-auth";
import { School } from "@/models/School";
import { User } from "@/models/User";
import { Book } from "@/models/Book";
import { Student } from "@/models/Student";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";

const createSchema = z.object({
  name: z.string().min(1),
  schoolType: z.enum(["ilkokul", "ortaokul", "lise", "diger"]),
  barcodeEnabled: z.boolean().optional().default(true),
  defaultLoanDays: z.number().min(1).max(365).optional().default(14),
  adminUsername: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  staffUsername: z.string().min(2),
  staffPassword: z.string().min(6),
});

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSuper(auth.user);
  if (deny) return deny;
  const schools = await School.find().sort({ createdAt: -1 }).lean();
  const counts = await Promise.all(
    schools.map(async (s) => {
      const [users, books, students] = await Promise.all([
        User.countDocuments({ schoolId: s._id }),
        Book.countDocuments({ schoolId: s._id }),
        Student.countDocuments({ schoolId: s._id }),
      ]);
      return { schoolId: String(s._id), users, books, students };
    })
  );
  const map = Object.fromEntries(counts.map((c) => [c.schoolId, c]));
  return NextResponse.json({
    schools: schools.map((s) => ({
      id: String(s._id),
      name: s.name,
      schoolType: s.schoolType,
      barcodeEnabled: s.barcodeEnabled,
      defaultLoanDays: s.defaultLoanDays,
      createdAt: s.createdAt,
      stats: map[String(s._id)],
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSuper(auth.user);
  if (deny) return deny;
  let body: z.infer<typeof createSchema>;
  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", issues: parsed.error.flatten() }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const adminUsername = body.adminUsername.trim();
  const staffUsername = body.staffUsername.trim();
  let schoolId: InstanceType<typeof School>["_id"] | null = null;
  let usersCommitted = false;
  try {
    const school = await School.create({
      name: body.name.trim(),
      schoolType: body.schoolType,
      barcodeEnabled: body.barcodeEnabled,
      defaultLoanDays: body.defaultLoanDays,
    });
    schoolId = school._id;
    const [adminHash, staffHash] = await Promise.all([
      hashPassword(body.adminPassword),
      hashPassword(body.staffPassword),
    ]);
    try {
      await User.create({
        username: adminUsername,
        email: body.adminEmail.trim(),
        passwordHash: adminHash,
        role: "school_admin",
        schoolId,
        isActive: true,
      });
    } catch (firstUserErr) {
      await School.findByIdAndDelete(schoolId);
      throw firstUserErr;
    }
    try {
      await User.create({
        username: staffUsername,
        email: null,
        passwordHash: staffHash,
        role: "staff",
        schoolId,
        isActive: true,
      });
    } catch (secondUserErr) {
      await User.deleteMany({ schoolId });
      await School.findByIdAndDelete(schoolId);
      throw secondUserErr;
    }
    usersCommitted = true;
    await logActivity({
      schoolId: null,
      userId: auth.user.id,
      username: auth.user.username,
      role: auth.user.role,
      action: "Okul oluşturuldu",
      detail: body.name,
      meta: { schoolId: String(schoolId) },
    });
    return NextResponse.json({
      school: {
        id: String(schoolId),
        name: school.name,
        schoolType: school.schoolType,
      },
    });
  } catch (e: unknown) {
    if (schoolId && !usersCommitted) {
      await User.deleteMany({ schoolId }).catch(() => {});
      await School.findByIdAndDelete(schoolId).catch(() => {});
    }
    if (e && typeof e === "object" && "code" in e && (e as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Kullanıcı adı bu okulda veya sistemde mevcut" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
