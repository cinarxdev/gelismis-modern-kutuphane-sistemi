import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { Loan } from "@/models/Loan";
import { School } from "@/models/School";
import { Student } from "@/models/Student";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const schoolFilter: Record<string, unknown> =
    auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId };

  const loanMatchSchool =
    auth.user.role === "super_admin"
      ? {}
      : { schoolId: new mongoose.Types.ObjectId(auth.user.schoolId!) };

  type TopB = {
    studentId: string;
    fullName: string;
    gradeClass: string | null;
    loanCount: number;
  };
  const topBorrowersPromise =
    auth.user.role === "super_admin"
      ? Promise.resolve([] as TopB[])
      : Loan.aggregate([
          { $match: loanMatchSchool },
          { $group: { _id: "$studentId", loanCount: { $sum: 1 } } },
          { $sort: { loanCount: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: Student.collection.name,
              localField: "_id",
              foreignField: "_id",
              as: "st",
            },
          },
          { $unwind: { path: "$st", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              studentId: { $toString: "$_id" },
              loanCount: 1,
              fullName: { $ifNull: ["$st.fullName", "—"] },
              gradeClass: "$st.gradeClass",
            },
          },
        ]);

  const lostBooksFilter = { ...schoolFilter, isLost: true };
  const loanedBooksFilter = { ...schoolFilter, isAvailable: false, isLost: { $ne: true } };

  const [
    totalBooks,
    availableBooks,
    lostBooks,
    loanedCopies,
    totalStudents,
    totalLoansEver,
    activeLoans,
    overdueLoans,
    returnedLoans,
    lostLoans,
    schoolCount,
    loansLast30,
    loansToday,
    topBorrowers,
  ] = await Promise.all([
    Book.countDocuments(schoolFilter),
    Book.countDocuments({ ...schoolFilter, isAvailable: true }),
    Book.countDocuments(lostBooksFilter),
    Book.countDocuments(loanedBooksFilter),
    Student.countDocuments(
      auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }
    ),
    Loan.countDocuments(
      auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }
    ),
    Loan.countDocuments({
      ...(auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }),
      status: "active",
    }),
    Loan.countDocuments({
      ...(auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }),
      status: "active",
      dueDate: { $lt: now },
    }),
    Loan.countDocuments({
      ...(auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }),
      status: "returned",
    }),
    Loan.countDocuments({
      ...(auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }),
      status: "lost",
    }),
    auth.user.role === "super_admin" ? School.countDocuments() : Promise.resolve(0),
    Loan.find({
      ...(auth.user.role === "super_admin" ? {} : { schoolId: auth.user.schoolId }),
      borrowedAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    })
      .select("borrowedAt")
      .lean(),
    Loan.countDocuments({
      ...schoolFilter,
      borrowedAt: { $gte: startOfDay },
    }),
    topBorrowersPromise,
  ]);

  const dayBuckets: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayBuckets[key] = 0;
  }
  for (const row of loansLast30) {
    const key = new Date(row.borrowedAt).toISOString().slice(0, 10);
    if (key in dayBuckets) dayBuckets[key] += 1;
  }
  const chartLoansByDay = Object.entries(dayBuckets).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    totalBooks,
    availableBooks,
    loanedBooks: loanedCopies,
    lostBooks,
    lostLoans,
    totalStudents,
    totalLoansEver,
    activeLoans,
    overdueLoans,
    returnedLoans,
    schoolCount,
    chartLoansByDay,
    loansToday,
    topBorrowers,
  });
}
