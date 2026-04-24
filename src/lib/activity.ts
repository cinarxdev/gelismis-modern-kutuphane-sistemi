import { ActivityLog } from "@/models/ActivityLog";
import type { Types } from "mongoose";

export async function logActivity(opts: {
  schoolId: Types.ObjectId | string | null;
  userId: Types.ObjectId | string;
  username: string;
  role: string;
  action: string;
  detail?: string;
  meta?: Record<string, unknown>;
}) {
  await ActivityLog.create({
    schoolId: opts.schoolId,
    userId: opts.userId,
    username: opts.username,
    role: opts.role,
    action: opts.action,
    detail: opts.detail ?? "",
    meta: opts.meta ?? {},
  });
}
