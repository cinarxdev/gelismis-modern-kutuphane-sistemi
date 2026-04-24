import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchoolAdmin } from "@/lib/api-auth";
import { School } from "@/models/School";
import { logActivity } from "@/lib/activity";
import { leanOne } from "@/lib/lean";

type SchoolLean = {
  _id: unknown;
  name: string;
  schoolType: string;
  barcodeEnabled: boolean;
  shelves?: string[];
  defaultLoanDays: number;
  loanDaysLocked?: boolean;
  maxLoanExtensions?: number;
  logoMimeType?: string | null;
};

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  barcodeEnabled: z.boolean().optional(),
  defaultLoanDays: z.number().min(1).max(365).optional(),
  loanDaysLocked: z.boolean().optional(),
  maxLoanExtensions: z.number().int().min(0).max(20).optional(),
  shelves: z
    .array(z.string())
    .max(120)
    .optional()
    .transform((arr) => {
      if (!arr) return undefined;
      const seen = new Set<string>();
      const out: string[] = [];
      for (const s of arr) {
        const t = s.trim();
        if (!t || t.length > 64) continue;
        if (seen.has(t)) continue;
        seen.add(t);
        out.push(t);
      }
      return out;
    }),
});

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchoolAdmin(auth.user);
  if (deny) return deny;
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
  const school = leanOne<SchoolLean>(
    await School.findByIdAndUpdate(auth.user.schoolId, { $set: body }, { new: true }).lean()
  );
  if (!school) {
    return NextResponse.json({ error: "Okul bulunamadı" }, { status: 404 });
  }
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Okul ayarları güncellendi",
    detail: JSON.stringify(body),
  });
  return NextResponse.json({
    school: {
      id: String(school._id),
      name: school.name,
      schoolType: school.schoolType,
      barcodeEnabled: school.barcodeEnabled,
      shelves: Array.isArray(school.shelves) ? school.shelves : [],
      defaultLoanDays: school.defaultLoanDays,
      loanDaysLocked: Boolean(school.loanDaysLocked),
      maxLoanExtensions: school.maxLoanExtensions ?? 2,
      hasLogo: Boolean(school.logoMimeType),
    },
  });
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  if (!auth.user.schoolId || (auth.user.role !== "school_admin" && auth.user.role !== "staff")) {
    return NextResponse.json({ error: "Okul hesabı gerekli" }, { status: 403 });
  }
  const school = leanOne<SchoolLean>(
    await School.findOne({ _id: auth.user.schoolId }).lean()
  );
  if (!school) {
    return NextResponse.json({ error: "Okul bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({
    school: {
      id: String(school._id),
      name: school.name,
      schoolType: school.schoolType,
      barcodeEnabled: school.barcodeEnabled,
      shelves: Array.isArray(school.shelves) ? school.shelves : [],
      defaultLoanDays: school.defaultLoanDays,
      loanDaysLocked: Boolean(school.loanDaysLocked),
      maxLoanExtensions: school.maxLoanExtensions ?? 2,
      hasLogo: Boolean(school.logoMimeType),
    },
  });
}
