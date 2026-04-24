import { NextResponse } from "next/server";
import { requireAuth, requireSchool, requireSchoolAdmin } from "@/lib/api-auth";
import { School } from "@/models/School";
import { logActivity } from "@/lib/activity";

const MAX_LOGO_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function normalizeMime(raw: string, fileName: string): string | null {
  const t = raw?.trim().toLowerCase();
  if (t && ALLOWED_MIME.has(t)) return t;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return null;
}

function decodeLogoBase64(b64: string | null | undefined): Buffer | null {
  if (typeof b64 !== "string" || !b64.trim()) return null;
  try {
    const buf = Buffer.from(b64, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const school = await School.findById(auth.user.schoolId)
    .select("logoBase64 logoMimeType logoBinary")
    .lean();
  if (!school || typeof school !== "object") {
    return new NextResponse(null, { status: 404 });
  }
  const rec = school as {
    logoBase64?: string | null;
    logoMimeType?: string | null;
    logoBinary?: Buffer | null;
  };
  let bin = decodeLogoBase64(rec.logoBase64);
  if (!bin?.length && rec.logoBinary && Buffer.isBuffer(rec.logoBinary) && rec.logoBinary.length > 0) {
    bin = rec.logoBinary;
  }
  const mime = rec.logoMimeType;
  if (!bin?.length) {
    return new NextResponse(null, { status: 404 });
  }
  const ct = mime && ALLOWED_MIME.has(mime) ? mime : "image/png";
  return new NextResponse(new Uint8Array(bin), {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchoolAdmin(auth.user);
  if (deny) return deny;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (file.size > MAX_LOGO_UPLOAD_BYTES) {
    return NextResponse.json({ error: "En fazla 10 MB" }, { status: 400 });
  }
  const mime = normalizeMime(file.type, file.name);
  if (!mime) {
    return NextResponse.json(
      { error: "Yalnızca JPEG, PNG, WebP veya GIF" },
      { status: 400 }
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const logoBase64 = buf.toString("base64");
  await School.findByIdAndUpdate(auth.user.schoolId, {
    $set: { logoBase64, logoMimeType: mime },
    $unset: { logoBinary: "" },
  });
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Okul logosu güncellendi",
    detail: mime,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchoolAdmin(auth.user);
  if (deny) return deny;
  await School.findByIdAndUpdate(auth.user.schoolId, {
    $set: { logoBase64: null, logoMimeType: null },
    $unset: { logoBinary: "" },
  });
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Okul logosu kaldırıldı",
    detail: "",
  });
  return NextResponse.json({ ok: true });
}
