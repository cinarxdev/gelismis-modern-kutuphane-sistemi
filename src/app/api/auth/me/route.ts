import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { School } from "@/models/School";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  await connectDB();
  const user = await User.findOne({ _id: session.sub }).lean();
  if (!user || !("isActive" in user) || !user.isActive) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  let schoolName = session.schoolName;
  if (user.schoolId && !schoolName) {
    const s = await School.findOne({ _id: user.schoolId }).select("name").lean();
    if (s && typeof s === "object" && "name" in s) {
      schoolName = String((s as unknown as { name: string }).name);
    }
  }
  return NextResponse.json({
    user: {
      id: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? String(user.schoolId) : null,
      schoolName,
    },
  });
}
