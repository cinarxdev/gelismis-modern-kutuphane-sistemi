import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SchoolApplication } from "@/models/SchoolApplication";
import { requireAuth, requireSuper } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const required = ["schoolName", "schoolType", "il", "ilce", "adres", "contactName", "contactEmail", "contactPhone"];
    for (const key of required) {
      if (!body[key] || String(body[key]).trim() === "") {
        return NextResponse.json({ error: `${key} alanı zorunludur` }, { status: 400 });
      }
    }
    const app = await SchoolApplication.create({
      schoolName: body.schoolName.trim(),
      schoolType: body.schoolType,
      studentCount: Number(body.studentCount) || 0,
      bookCountRange: (body.bookCountRange || "").trim(),
      il: body.il.trim(),
      ilce: body.ilce.trim(),
      adres: (body.adres || "").trim(),
      contactName: body.contactName.trim(),
      contactRole: (body.contactRole || "").trim(),
      contactEmail: body.contactEmail.trim(),
      contactPhone: body.contactPhone.trim(),
      website: (body.website || "").trim(),
      notes: (body.notes || "").trim(),
    });
    return NextResponse.json({ ok: true, id: String(app._id) }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const denied = requireSuper(auth.user);
  if (denied) return denied;
  await connectDB();
  const apps = await SchoolApplication.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    applications: apps.map((a: Record<string, unknown>) => ({
      id: String(a._id),
      schoolName: a.schoolName,
      schoolType: a.schoolType,
      studentCount: a.studentCount,
      bookCountRange: a.bookCountRange,
      il: a.il,
      ilce: a.ilce,
      adres: a.adres,
      contactName: a.contactName,
      contactRole: a.contactRole,
      contactEmail: a.contactEmail,
      contactPhone: a.contactPhone,
      website: a.website,
      notes: a.notes,
      status: a.status,
      createdAt: a.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const denied = requireSuper(auth.user);
  if (denied) return denied;
  await connectDB();
  const body = await req.json();
  const { id, status } = body;
  if (!id || !["onaylandi", "reddedildi"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const doc = await SchoolApplication.findById(id);
  if (!doc) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
  }
  doc.status = status;
  await doc.save();
  return NextResponse.json({ ok: true, status: doc.status });
}
