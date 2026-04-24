import { NextResponse } from "next/server";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { Loan } from "@/models/Loan";
import { logActivity } from "@/lib/activity";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { id } = await ctx.params;
  const loan = await Loan.findOne({
    _id: id,
    schoolId: auth.user.schoolId,
    status: "active",
  });
  if (!loan) {
    return NextResponse.json({ error: "Aktif ödünç kaydı yok" }, { status: 404 });
  }
  loan.status = "returned";
  loan.returnedAt = new Date();
  await loan.save();
  await Book.updateOne(
    { _id: loan.bookId, schoolId: auth.user.schoolId },
    { $set: { isAvailable: true, currentLoanId: null } }
  );
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Kitap iade alındı",
    detail: String(loan._id),
  });
  return NextResponse.json({ ok: true });
}
