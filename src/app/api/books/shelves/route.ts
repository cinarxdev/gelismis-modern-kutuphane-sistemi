import { NextResponse } from "next/server";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { School } from "@/models/School";
import { leanOne } from "@/lib/lean";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const school = leanOne<{ shelves?: string[] }>(
    await School.findOne({ _id: auth.user.schoolId }).select("shelves").lean()
  );
  const fromSchool = (Array.isArray(school?.shelves) ? school.shelves : [])
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);
  const raw = await Book.distinct("shelfNumber", {
    schoolId: auth.user.schoolId,
    shelfNumber: { $nin: [null, ""] },
  });
  const fromBooks = (raw as (string | null)[])
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
  const merged = [...new Set([...fromSchool, ...fromBooks])].sort((a, b) =>
    a.localeCompare(b, "tr", { numeric: true })
  );
  return NextResponse.json({ shelves: merged });
}
