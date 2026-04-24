"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookPlus,
  BookOpenCheck,
  ClipboardList,
  Library,
  Users,
  Wrench,
  ScrollText,
  Building2,
  ChevronDown,
  Shield,
  UserCog,
  Settings2,
  User,
  LogOut,
  Loader2,
  FileInput,
} from "lucide-react";

export type PanelUser = {
  username: string;
  role: string;
  schoolName: string | null;
  schoolHasLogo?: boolean;
};

const roleLabel: Record<string, string> = {
  super_admin: "Platform yöneticisi",
  school_admin: "Okul yöneticisi",
  staff: "Görevli",
};

function userInitials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  if (t.length === 1) return t.toUpperCase();
  return (t[0] + t[1]).toUpperCase();
}

function SidebarBrandTitle({ text, className }: { text: string; className?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const gaugeRef = React.useRef<HTMLSpanElement>(null);
  const [shift, setShift] = React.useState(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useLayoutEffect(() => {
    const gauge = gaugeRef.current;
    const box = containerRef.current;
    if (!gauge || !box) return;
    const update = () => {
      const tw = gauge.scrollWidth;
      const cw = box.clientWidth;
      setShift(Math.max(0, Math.ceil(tw - cw)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text]);

  const scroll = shift > 0 && !reduceMotion;
  const duration = Math.min(22, Math.max(12, 8 + shift / 18));

  return (
    <div ref={containerRef} className="relative min-w-0 w-full overflow-hidden">
      <span
        ref={gaugeRef}
        className={`pointer-events-none absolute left-0 top-0 -z-10 whitespace-nowrap opacity-0 ${className}`}
        aria-hidden
      >
        {text}
      </span>
      {scroll ? (
        <motion.span
          key={`${text}-${shift}`}
          className={`inline-block whitespace-nowrap will-change-transform ${className}`}
          initial={{ x: 0 }}
          animate={{ x: [0, -shift, 0] }}
          transition={{
            duration,
            times: [0, 0.5, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          {text}
        </motion.span>
      ) : (
        <p className={`truncate ${className}`} title={shift > 0 ? text : undefined}>
          {text}
        </p>
      )}
    </div>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  schoolOnly?: boolean;
  tint: string;
};

const iconTint: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/18 dark:text-cyan-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/18 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/18 dark:text-rose-300",
  slate: "bg-slate-200 text-slate-700 dark:bg-slate-600/30 dark:text-slate-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-500/18 dark:text-orange-300",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/18 dark:text-sky-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-500/18 dark:text-teal-300",
};

const mainNav: NavItem[] = [
  { href: "/panel", label: "Ana Sayfa", icon: LayoutDashboard, tint: "indigo" },
  { href: "/panel/kitap-ekle", label: "Kitap Ekle", icon: BookPlus, schoolOnly: true, tint: "emerald" },
  { href: "/panel/odunc-ver", label: "Kitap Ödünç Ver", icon: BookOpenCheck, schoolOnly: true, tint: "violet" },
  { href: "/panel/odunc-kayitlari", label: "Ödünç Kayıtları", icon: ClipboardList, schoolOnly: true, tint: "cyan" },
  { href: "/panel/kitaplar", label: "Kitap Listesi", icon: Library, schoolOnly: true, tint: "amber" },
  { href: "/panel/ogrenciler", label: "Öğrenciler", icon: Users, schoolOnly: true, tint: "rose" },
];

function NavIcon({ icon: Icon, tint }: { icon: LucideIcon; tint: string }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTint[tint] ?? iconTint.slate}`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function Sidebar({ user }: { user: PanelUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [toolsOpen, setToolsOpen] = React.useState(pathname.startsWith("/panel/loglar"));
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/giris");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }
  const isSuper = user.role === "super_admin";
  const isSchoolAdmin = user.role === "school_admin";

  const rowBase =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";
  const rowActive = "bg-[var(--sidebar-active)] text-[var(--sidebar-fg)]";
  const rowIdle =
    "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]";

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] shadow-sm dark:shadow-none"
    >
      <div className="flex min-h-[5.25rem] items-center gap-3 border-b border-[var(--sidebar-border)] px-5 py-3">
        <div className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-hover)]/50">
          {user.schoolHasLogo && !isSuper ? (
            <Image
              src="/api/school/logo"
              alt=""
              fill
              className="object-contain p-1"
              sizes="52px"
              unoptimized
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center rounded-xl ${iconTint.indigo}`}>
              <Library className="h-7 w-7" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {isSuper ? (
            <p className="truncate text-base font-semibold leading-tight tracking-tight text-[var(--sidebar-fg)]">
              Platform
            </p>
          ) : (
            <SidebarBrandTitle
              text={user.schoolName || "Okul"}
              className="text-base font-semibold leading-tight tracking-tight text-[var(--sidebar-fg)]"
            />
          )}
          {isSuper && (
            <p className="mt-0.5 truncate text-xs text-[var(--sidebar-muted)]">Yönetim</p>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => {
          if (item.schoolOnly && isSuper) return null;
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/panel" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.span
                className={`${rowBase} ${active ? rowActive : rowIdle}`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <NavIcon icon={Icon} tint={item.tint} />
                {item.label}
              </motion.span>
            </Link>
          );
        })}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setToolsOpen((o) => !o)}
            className={`${rowBase} w-full justify-between text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]`}
          >
            <span className="flex items-center gap-3">
              <NavIcon icon={Wrench} tint="slate" />
              Araçlar
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--sidebar-muted)] transition ${toolsOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {toolsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pl-2"
              >
                <Link href="/panel/loglar">
                  <span
                    className={`${rowBase} mt-1 ${
                      pathname.startsWith("/panel/loglar") ? rowActive : rowIdle
                    }`}
                  >
                    <NavIcon icon={ScrollText} tint="orange" />
                    Log Kayıtları
                  </span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isSuper && (
          <div className="mt-6 border-t border-[var(--sidebar-border)] pt-4">
            <p className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md ${iconTint.violet}`}>
                <Shield className="h-3.5 w-3.5" />
              </span>
              Yönetici
            </p>
            <Link href="/panel/yonetim/okullar">
              <motion.span
                className={`${rowBase} ${
                  pathname === "/panel/yonetim/okullar" ? rowActive : rowIdle
                }`}
                whileHover={{ x: 2 }}
              >
                <NavIcon icon={Building2} tint="blue" />
                Okullar
              </motion.span>
            </Link>
            <Link href="/panel/yonetim/basvurular">
              <motion.span
                className={`${rowBase} mt-1 ${
                  pathname === "/panel/yonetim/basvurular" ? rowActive : rowIdle
                }`}
                whileHover={{ x: 2 }}
              >
                <NavIcon icon={FileInput} tint="orange" />
                Okul Başvuruları
              </motion.span>
            </Link>
          </div>
        )}

        {isSchoolAdmin && (
          <div className="mt-6 border-t border-[var(--sidebar-border)] pt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-section)]">
              Okul
            </p>
            <Link href="/panel/okul/gorevliler">
              <span
                className={`${rowBase} ${
                  pathname.startsWith("/panel/okul/gorevliler") ? rowActive : rowIdle
                }`}
              >
                <NavIcon icon={UserCog} tint="teal" />
                Görevliler
              </span>
            </Link>
            <Link href="/panel/okul/ayarlar">
              <span
                className={`${rowBase} mt-1 ${
                  pathname.startsWith("/panel/okul/ayarlar") ? rowActive : rowIdle
                }`}
              >
                <NavIcon icon={Settings2} tint="indigo" />
                Okul Ayarları
              </span>
            </Link>
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3">
        <div
          className="flex items-center gap-2 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-hover)]/40 p-2 dark:bg-white/[0.04]"
          title={user.username}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 px-1 py-0.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200">
              {userInitials(user.username)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-semibold text-[var(--sidebar-fg)]">{user.username}</p>
              <p className="flex items-center gap-1 truncate text-xs text-[var(--sidebar-muted)]">
                <User className="h-3 w-3 shrink-0 opacity-70" />
                {roleLabel[user.role] ?? user.role}
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut}
            aria-label="Çıkış yap"
            title="Çıkış"
            className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-2.5 text-[var(--sidebar-muted)] transition hover:border-red-300/50 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:border-red-500/30 dark:hover:bg-red-500/15 dark:hover:text-red-400"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
