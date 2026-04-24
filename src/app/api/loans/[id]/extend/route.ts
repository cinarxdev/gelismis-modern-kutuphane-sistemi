import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Loan } from "@/models/Loan";
import { School } from "@/models/School";
import { logActivity } from "@/lib/activity";
import { leanOne } from "@/lib/lean";

const extendSchema = z.object({
  days: z.union([z.literal(3), z.literal(7), z.literal(14)]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { id } = await ctx.params;
  let body: z.infer<typeof extendSchema>;
  try {
    const json = await req.json();
    const parsed = extendSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri; yalnızca 3, 7 veya 14 gün seçilebilir." }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const school = leanOne<{ maxLoanExtensions?: number }>(
    await School.findOne({ _id: auth.user.schoolId }).select("maxLoanExtensions").lean()
  );
  if (!school) {
    return NextResponse.json({ error: "Okul bulunamadı" }, { status: 404 });
  }
  const maxExt = school.maxLoanExtensions ?? 2;
  if (maxExt <= 0) {
    return NextResponse.json({ error: "Bu okulda süre uzatma kapalı." }, { status: 400 });
  }

  const loan = await Loan.findOne({
    _id: id,
    schoolId: auth.user.schoolId,
    status: "active",
  });
  if (!loan) {
    return NextResponse.json({ error: "Aktif ödünç kaydı bulunamadı" }, { status: 404 });
  }

  const used = loan.extensionCount ?? 0;
  if (used >= maxExt) {
    return NextResponse.json(
      { error: `Bu ödünç için en fazla ${maxExt} kez süre uzatılabilir (limit doldu).` },
      { status: 400 }
    );
  }

  const prevDue = loan.dueDate;
  const ms = body.days * 24 * 60 * 60 * 1000;
  const newDue = new Date(prevDue.getTime() + ms);

  loan.dueDate = newDue;
  loan.extensionCount = used + 1;
  if (!Array.isArray(loan.extensionHistory)) {
    loan.extensionHistory = [];
  }
  loan.extensionHistory.push({
    at: new Date(),
    daysAdded: body.days,
    previousDueDate: prevDue,
    newDueDate: newDue,
  });
  await loan.save();

  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Ödünç süresi uzatıldı",
    detail: `+${body.days} gün → ${newDue.toISOString().slice(0, 10)}`,
    meta: { loanId: String(loan._id) },
  });

  return NextResponse.json({
    loan: {
      id: String(loan._id),
      dueDate: loan.dueDate,
      extensionCount: loan.extensionCount,
      extensionHistory: loan.extensionHistory.map(
        (h: { at: Date; daysAdded: number; previousDueDate: Date; newDueDate: Date }) => ({
          at: h.at,
          daysAdded: h.daysAdded,
          previousDueDate: h.previousDueDate,
          newDueDate: h.newDueDate,
        })
      ),
    },
  });
}
