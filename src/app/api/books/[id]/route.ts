import { NextResponse } from "next/server";
import { requireAuth, requireSchool } from "@/lib/api-auth";
import { Book } from "@/models/Book";
import { logActivity } from "@/lib/activity";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const deny = requireSchool(auth.user);
  if (deny) return deny;
  const { id } = await ctx.params;
  const book = await Book.findOne({ _id: id, schoolId: auth.user.schoolId });
  if (!book) {
    return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
  }
  if (!book.isAvailable && !book.isLost) {
    return NextResponse.json({ error: "Ödünçte olan kitap silinemez" }, { status: 400 });
  }
  await book.deleteOne();
  await logActivity({
    schoolId: auth.user.schoolId,
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.user.role,
    action: "Kitap silindi",
    detail: book.title,
  });
  return NextResponse.json({ ok: true });
}
