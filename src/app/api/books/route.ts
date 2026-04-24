import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { School } from "@/models/School";
import { logActivity } from "@/lib/activity";
import { leanOne } from "@/lib/lean";

const createSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  publicationDate: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  pageCount: z.number().int().positive().optional().nullable(),
  barcode: z.string().optional().nullable(),
  shelfNumber: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const available = searchParams.get("available");
  const lost = searchParams.get("lost");
  const shelf = searchParams.get("shelf")?.trim();
  const clauses: Record<string, unknown>[] = [{ schoolId: auth.user.schoolId }];
  if (lost === "true") {
    clauses.push({ isLost: true });
  } else {
    if (available === "true") clauses.push({ isAvailable: true });
    if (available === "false") clauses.push({ isAvailable: false, isLost: { $ne: true } });
  }
  if (shelf) clauses.push({ shelfNumber: shelf });
  if (q) {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    clauses.push({
      $or: [
        { title: new RegExp(esc, "i") },
        { author: new RegExp(esc, "i") },
        { barcode: new RegExp(esc, "i") },
        { shelfNumber: new RegExp(esc, "i") },
      ],
    });
  }
  const filter = clauses.length === 1 ? clauses[0] : { $and: clauses };
  const books = await Book.find(filter).sort({ createdAt: -1 }).limit(120).lean();
  return NextResponse.json({
    books: books.map((b) => ({
      id: String(b._id),
      title: b.title,
      author: b.author,
      publicationDate: b.publicationDate,
      publisher: b.publisher,
      pageCount: b.pageCount,
      barcode: b.barcode,
      shelfNumber: b.shelfNumber ?? null,
      isAvailable: b.isAvailable,
      isLost: Boolean((b as { isLost?: boolean }).isLost),
      createdAt: b.createdAt,
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
  const school = leanOne<{ barcodeEnabled: boolean; shelves?: string[] }>(
    await School.findOne({ _id: auth.user.schoolId }).select("barcodeEnabled shelves").lean()
  );
  if (!school) {
    return NextResponse.json({ error: "Okul bulunamadı" }, { status: 404 });
  }
  const barcodeVal = body.barcode?.trim() || null;
  if (school.barcodeEnabled && (!barcodeVal || barcodeVal.length === 0)) {
    return NextResponse.json({ error: "Barkod zorunlu" }, { status: 400 });
  }
  let pubDate: Date | null = null;
  if (body.publicationDate && String(body.publicationDate).trim()) {
    const d = new Date(body.publicationDate);
    if (!Number.isNaN(d.getTime())) pubDate = d;
  }
  const allowedShelves = (Array.isArray(school.shelves) ? school.shelves : [])
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);
  const shelfVal = body.shelfNumber?.trim() || null;
  if (shelfVal) {
    if (allowedShelves.length === 0) {
      return NextResponse.json(
        { error: "Önce okul ayarlarından raf tanımlayın veya raf alanını boş bırakın." },
        { status: 400 }
      );
    }
    if (!allowedShelves.includes(shelfVal)) {
      return NextResponse.json({ error: "Raf yalnızca okulda tanımlı etiketlerden seçilebilir." }, { status: 400 });
    }
  }
  const b = await Book.create({
    schoolId: auth.user.schoolId,
    title: body.title.trim(),
    author: body.author.trim(),
    publicationDate: pubDate,
    publisher: body.publisher?.trim() || null,
    pageCount: body.pageCount ?? null,
    barcode: barcodeVal,
    shelfNumber: shelfVal,
    isAvailable: true,
    isLost: false,
    currentLoanId: null,
  });
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Kitap eklendi",
    detail: b.title,
    meta: { bookId: String(b._id) },
  });
  return NextResponse.json({
    book: {
      id: String(b._id),
      title: b.title,
      author: b.author,
      barcode: b.barcode,
      isAvailable: b.isAvailable,
    },
  });
}
