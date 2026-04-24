import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { School } from "@/models/School";
import { Sidebar } from "@/components/panel/sidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/giris");
  }
  await connectDB();
  const user = await User.findOne({ _id: session.sub }).lean();
  if (!user || !("isActive" in user) || !user.isActive) {
    redirect("/giris");
  }
  let schoolName: string | null = session.schoolName ?? null;
  let schoolHasLogo = false;
  if (user.schoolId) {
    const s = await School.findOne({ _id: user.schoolId }).select("name logoMimeType").lean();
    if (s && typeof s === "object") {
      const rec = s as { name?: string; logoMimeType?: string | null };
      if (typeof rec.name === "string") schoolName = rec.name;
      schoolHasLogo = Boolean(rec.logoMimeType);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar
        user={{
          username: String(user.username),
          role: String(user.role),
          schoolName,
          schoolHasLogo,
        }}
      />
      <div className="pl-[260px]">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
