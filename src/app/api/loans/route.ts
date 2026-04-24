import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { Loan } from "@/models/Loan";
import { School } from "@/models/School";
import { Student } from "@/models/Student";
import { logActivity } from "@/lib/activity";
import { leanOne } from "@/lib/lean";

const lendSchema = z.object({
  studentId: z.string().min(1),
  bookId: z.string().optional(),
  barcode: z.string().optional(),
  loanDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const filter: Record<string, unknown> = { schoolId: auth.user.schoolId };
  if (status === "active" || status === "returned" || status === "overdue" || status === "lost") {
    if (status === "overdue") {
      filter.status = "active";
      filter.dueDate = { $lt: new Date() };
    } else {
      filter.status = status;
    }
  }
  const loans = await Loan.find(filter)
    .sort({ borrowedAt: -1 })
    .limit(300)
    .populate("bookId", "title author barcode")
    .populate("studentId", "fullName studentNo gradeClass")
    .populate("issuedByUserId", "username")
    .lean();
  const now = new Date();
  type ExtEntry = { at: Date; daysAdded: number; previousDueDate: Date; newDueDate: Date };
  return NextResponse.json({
    loans: loans.map((l) => {
      const book = l.bookId as { title?: string; author?: string; barcode?: string } | null;
      const st = l.studentId as {
        fullName?: string;
        studentNo?: string;
        gradeClass?: string;
      } | null;
      const issuer = l.issuedByUserId as { username?: string } | null;
      const dbStatus = String(l.status);
      const isOverdue = dbStatus === "active" && new Date(l.dueDate) < now;
      const lean = l as typeof l & {
        extensionCount?: number;
        extensionHistory?: ExtEntry[];
        lostAt?: Date | null;
      };
      const extHist = Array.isArray(lean.extensionHistory) ? lean.extensionHistory : [];
      const extensionCount = Number(lean.extensionCount ?? 0);
      return {
        id: String(l._id),
        bookId: String(l.bookId && typeof l.bookId === "object" && "_id" in l.bookId ? (l.bookId as { _id: unknown })._id : l.bookId),
        bookTitle: book?.title,
        bookAuthor: book?.author,
        bookBarcode: book?.barcode,
        studentId: String(
          l.studentId && typeof l.studentId === "object" && "_id" in l.studentId
            ? (l.studentId as { _id: unknown })._id
            : l.studentId
        ),
        studentName: st?.fullName,
        studentNo: st?.studentNo,
        gradeClass: st?.gradeClass,
        issuedBy: issuer?.username,
        borrowedAt: l.borrowedAt,
        dueDate: l.dueDate,
        returnedAt: l.returnedAt,
        lostAt: lean.lostAt ?? null,
        status: dbStatus === "lost" ? "lost" : isOverdue ? "overdue" : dbStatus,
        extensionCount,
        extensionHistory: extHist.map((h) => ({
          at: h.at,
          daysAdded: h.daysAdded,
          previousDueDate: h.previousDueDate,
          newDueDate: h.newDueDate,
        })),
      };
    }),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  let body: z.infer<typeof lendSchema>;
  try {
    const json = await req.json();
    const parsed = lendSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const school = leanOne<{ defaultLoanDays: number; loanDaysLocked?: boolean }>(
    await School.findOne({ _id: auth.user.schoolId }).lean()
  );
  if (!school) {
    return NextResponse.json({ error: "Okul bulunamadı" }, { status: 404 });
  }
  const locked = Boolean(school.loanDaysLocked);
  let loanDays = school.defaultLoanDays;
    if (body.loanDays != null) {
      if (locked && auth.user.role !== "super_admin") {
        loanDays = school.defaultLoanDays;
      } else {
        loanDays = body.loanDays;
      }
    }
  const student = await Student.findOne({
    _id: body.studentId,
    schoolId: auth.user.schoolId,
  });
  if (!student) {
    return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
  }
  let book = null;
  if (body.bookId) {
    book = await Book.findOne({
      _id: body.bookId,
      schoolId: auth.user.schoolId,
      isAvailable: true,
    });
  } else if (body.barcode?.trim()) {
    book = await Book.findOne({
      schoolId: auth.user.schoolId,
      barcode: body.barcode.trim(),
      isAvailable: true,
    });
  }
  if (!book) {
    return NextResponse.json({ error: "Uygun kitap kopyası bulunamadı" }, { status: 404 });
  }
  const borrowedAt = new Date();
  const dueMs = borrowedAt.getTime() + loanDays * 24 * 60 * 60 * 1000;
  const dueDate = new Date(dueMs);
  const loan = await Loan.create({
    schoolId: auth.user.schoolId,
    bookId: book._id,
    studentId: student._id,
    issuedByUserId: auth.user.id,
    borrowedAt,
    dueDate,
    returnedAt: null,
    status: "active",
  });
  book.isAvailable = false;
  book.currentLoanId = loan._id;
  await book.save();
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Kitap ödünç verildi",
    detail: `${book.title} → ${student.fullName}`,
    meta: { loanId: String(loan._id) },
  });
  return NextResponse.json({
    loan: {
      id: String(loan._id),
      dueDate: loan.dueDate,
      bookTitle: book.title,
      studentName: student.fullName,
    },
  });
}
