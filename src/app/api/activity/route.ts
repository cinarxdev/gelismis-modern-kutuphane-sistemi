import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.res;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);
  const filter =
    auth.user.role === "super_admin"
      ? {}
      : { schoolId: auth.user.schoolId };
  const logs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: String(l._id),
      username: l.username,
      role: l.role,
      action: l.action,
      detail: l.detail,
      createdAt: l.createdAt,
    })),
  });
}
