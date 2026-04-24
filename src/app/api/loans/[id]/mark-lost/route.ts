import { NextResponse } from "next/server";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { Loan } from "@/models/Loan";
import { Student } from "@/models/Student";
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
    return NextResponse.json({ error: "Aktif ödünç kaydı bulunamadı" }, { status: 404 });
  }

  const book = await Book.findOne({ _id: loan.bookId, schoolId: auth.user.schoolId });
  if (!book) {
    return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
  }
  if (book.isLost) {
    return NextResponse.json({ error: "Bu kopya zaten kayıp olarak işaretli" }, { status: 400 });
  }

  const lostAt = new Date();
  book.isLost = true;
  book.isAvailable = false;
  book.currentLoanId = null;
  await book.save();

  loan.status = "lost";
  loan.lostAt = lostAt;
  await loan.save();

  await Student.updateOne(
    { _id: loan.studentId, schoolId: auth.user.schoolId },
    { $inc: { lostBooksCount: 1 } }
  );

  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Kitap kayıp işaretlendi",
    detail: `${book.title} → öğrenci ödünç kaydı`,
    meta: { loanId: String(loan._id), bookId: String(book._id), studentId: String(loan.studentId) },
  });

  return NextResponse.json({
    ok: true,
    loan: { id: String(loan._id), status: "lost", lostAt },
    book: { id: String(book._id), isLost: true },
  });
}
