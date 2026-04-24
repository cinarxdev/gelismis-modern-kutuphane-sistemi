import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";

export async function ensureSuperAdmin() {
  const u = process.env.SUPER_ADMIN_USERNAME;
  const p = process.env.SUPER_ADMIN_PASSWORD;
  const e = process.env.SUPER_ADMIN_EMAIL ?? "";
  if (!u || !p) return;
  const exists = await User.findOne({ role: "super_admin" });
  if (exists) return;
  const passwordHash = await hashPassword(p);
  await User.create({
    username: u,
    email: e || null,
    passwordHash,
    role: "super_admin",
    schoolId: null,
    isActive: true,
  });
}
