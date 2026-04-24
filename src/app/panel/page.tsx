"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { useTheme } from "next-themes";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Library,
  BookMarked,
  BookOpen,
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  RotateCcw,
  LayoutDashboard,
  Trophy,
  Sparkles,
  ArrowRight,
  PackageX,
} from "lucide-react";

type TopBorrower = {
  studentId: string;
  fullName: string;
  gradeClass: string | null;
  loanCount: number;
};

type Stats = {
  totalBooks: number;
  availableBooks: number;
  loanedBooks: number;
  lostBooks: number;
  lostLoans: number;
  totalStudents: number;
  totalLoansEver: number;
  activeLoans: number;
  overdueLoans: number;
  returnedLoans: number;
  schoolCount: number;
  chartLoansByDay: { date: string; count: number }[];
  loansToday: number;
  topBorrowers: TopBorrower[];
};

function StatCard({
  label,
  value,
  icon: Icon,
  delay,
  accent,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
  accent?: "default" | "danger";
  tint?: "indigo" | "violet" | "teal" | "amber" | "rose" | "cyan" | "emerald";
}) {
  const t = tint ?? "indigo";
  const iconTints: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  const ring =
    accent === "danger"
      ? "ring-1 ring-rose-300/60 dark:ring-red-500/30"
      : "";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 400, damping: 28 }}
      className={`flex items-center gap-4 rounded-2xl border border-indigo-200/40 bg-white px-4 py-4 shadow-sm shadow-indigo-500/[0.06] dark:border-[var(--card-border)] dark:bg-[var(--card)] dark:shadow-none ${ring}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTints[t]}`}>
        <Icon className="h-5 w-5 opacity-95" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function LoanChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-[var(--card-border)] dark:bg-[var(--card)]">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{typeof v === "number" ? v : 0} ödünç</p>
    </div>
  );
}

export default function PanelDashboard() {
  const { resolvedTheme } = useTheme();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mr, sr] = await Promise.all([fetch("/api/auth/me"), fetch("/api/stats")]);
        const me = await mr.json();
        const s = await sr.json();
        if (cancelled) return;
        if (!mr.ok || !me.user) {
          setErr("Oturum gerekli");
          return;
        }
        setRole(me.user.role);
        if (!sr.ok) {
          setErr(s.error ?? "Veri alınamadı");
          return;
        }
        setStats(s);
      } catch {
        if (!cancelled) setErr("Ağ hatası");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuper = role === "super_admin";
  const isDark = resolvedTheme === "dark";
  const chartStroke = isDark ? "#a5b4fc" : "#6366f1";
  const chartFillId = "dashAreaFill";
  const gridStroke = isDark ? "rgba(148,163,184,0.14)" : "#e2e8f0";
  const axisTick = isDark ? "#94a3b8" : "#64748b";

  const panelClass =
    "rounded-2xl border border-indigo-200/45 bg-gradient-to-br from-white via-white to-indigo-50/50 p-5 shadow-sm shadow-indigo-500/[0.05] dark:border-[var(--card-border)] dark:from-[var(--card)] dark:via-[var(--card)] dark:to-indigo-950/40 dark:shadow-none";

  return (
    <>
      <HeaderBar
        title="Dashboard"
        subtitle={isSuper ? "Platform özeti" : "Kütüphane özeti"}
      />
      <div className="p-4 sm:p-6">
        {err && <p className="text-[var(--danger)]">{err}</p>}
        {stats && (
          <>
            <div className="mb-3 flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <LayoutDashboard className="h-[18px] w-[18px]" />
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-900/70 dark:text-indigo-200/80">
                Özet kartları
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {isSuper && (
                <StatCard
                  label="Kayıtlı okul"
                  value={stats.schoolCount}
                  icon={Building2}
                  delay={0}
                  tint="violet"
                />
              )}
              <StatCard
                label="Toplam kitap"
                value={stats.totalBooks}
                icon={BookMarked}
                delay={isSuper ? 0.04 : 0}
                tint="indigo"
              />
              <StatCard
                label="Müsait kitap"
                value={stats.availableBooks}
                icon={BookOpen}
                delay={isSuper ? 0.08 : 0.04}
                tint="emerald"
              />
              <StatCard
                label="Aktif ödünç"
                value={stats.activeLoans}
                icon={TrendingUp}
                delay={isSuper ? 0.12 : 0.08}
                tint="cyan"
              />
              <StatCard
                label="Geciken"
                value={stats.overdueLoans}
                icon={AlertTriangle}
                delay={isSuper ? 0.16 : 0.12}
                accent={stats.overdueLoans > 0 ? "danger" : undefined}
                tint="rose"
              />
              <StatCard
                label="Toplam ödünç"
                value={stats.totalLoansEver}
                icon={Library}
                delay={isSuper ? 0.2 : 0.16}
                tint="violet"
              />
              <StatCard
                label="İade edilen"
                value={stats.returnedLoans}
                icon={RotateCcw}
                delay={isSuper ? 0.24 : 0.2}
                tint="teal"
              />
              {!isSuper && (
                <StatCard
                  label="Kayıp kitap"
                  value={stats.lostBooks}
                  icon={PackageX}
                  delay={0.22}
                  tint="rose"
                />
              )}
              {!isSuper && (
                <StatCard label="Öğrenci" value={stats.totalStudents} icon={Users} delay={0.24} tint="amber" />
              )}
              {isSuper && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, type: "spring", stiffness: 400, damping: 28 }}
                  className="group col-span-2 flex min-h-[88px] items-center justify-between gap-4 rounded-2xl border border-indigo-200/50 bg-gradient-to-r from-indigo-50/90 to-slate-50/80 px-5 py-4 shadow-sm dark:border-indigo-500/20 dark:from-indigo-950/35 dark:to-slate-900/40 dark:shadow-none xl:col-span-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-200/70 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-900/80 dark:text-indigo-200/90">Yönetim</p>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Okullar</p>
                    </div>
                  </div>
                  <Link
                    href="/panel/yonetim/okullar"
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600/90 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500"
                  >
                    Aç
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-5">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 30 }}
                className={`${panelClass} lg:col-span-3`}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      Son 30 gün ödünç
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Günlük yeni ödünç işlemi sayısı</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-indigo-200/60 bg-indigo-50/80 px-3 py-2 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                    <span className="text-xs font-medium text-indigo-800/80 dark:text-indigo-200/80">Bugün</span>
                    <span className="text-lg font-bold tabular-nums text-indigo-700 dark:text-indigo-200">
                      {stats.loansToday}
                    </span>
                  </div>
                </div>
                <div className="h-[300px] w-full sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartLoansByDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartStroke} stopOpacity={isDark ? 0.35 : 0.28} />
                          <stop offset="100%" stopColor={chartStroke} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: axisTick, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v.slice(5).replace("-", ".")}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: axisTick, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={32}
                      />
                      <Tooltip content={<LoanChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={chartStroke}
                        strokeWidth={2}
                        fill={`url(#${chartFillId})`}
                        name="Ödünç"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, type: "spring", stiffness: 320, damping: 30 }}
                className={`${panelClass} lg:col-span-2`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                      En çok ödünç alanlar
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tüm zamanlar, işlem sayısına göre</p>
                  </div>
                </div>
                {!isSuper && stats.topBorrowers.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-500">Henüz ödünç kaydı yok</p>
                )}
                {isSuper && (
                  <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-500">
                    Okul hesabıyla giriş yaptığınızda bu okulun öğrenci sıralaması görünür.
                  </p>
                )}
                <ul className="space-y-2">
                  {!isSuper &&
                    stats.topBorrowers.map((row, i) => (
                      <motion.li
                        key={row.studentId}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.04 }}
                        className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-slate-50/90 px-3 py-2.5 transition hover:border-indigo-200/80 hover:bg-indigo-50/50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            i === 0
                              ? "bg-amber-200/80 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200"
                              : i === 1
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-500/25 dark:text-slate-200"
                                : i === 2
                                  ? "bg-orange-200/80 text-orange-900 dark:bg-orange-600/30 dark:text-orange-200"
                                  : "bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-slate-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{row.fullName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-500">{row.gradeClass || "—"}</p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold tabular-nums text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">
                          {row.loanCount}
                        </span>
                      </motion.li>
                    ))}
                </ul>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
