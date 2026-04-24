"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2,
  ScrollText,
  Search,
  X,
  User,
  Clock,
  Library,
  Users,
  Building2,
  RotateCcw,
  Shield,
  History,
  Filter,
  ChevronDown,
  ListFilter,
} from "lucide-react";

type Log = {
  id: string;
  username: string;
  role: string;
  action: string;
  detail: string;
  createdAt: string;
};

const roleLabel: Record<string, string> = {
  super_admin: "Platform yöneticisi",
  school_admin: "Okul yöneticisi",
  staff: "Görevli",
};

function logIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes("kitap") || a.includes("ödünç") || a.includes("iade")) {
    if (a.includes("iade") || a.includes("ödünç")) return RotateCcw;
    return Library;
  }
  if (a.includes("öğrenci")) return Users;
  if (a.includes("okul") || a.includes("ayar")) return Building2;
  if (a.includes("görevli") || a.includes("kullanıcı")) return User;
  return ScrollText;
}

function roleTint(role: string): "violet" | "indigo" | "slate" {
  if (role === "super_admin") return "violet";
  if (role === "school_admin") return "indigo";
  return "slate";
}

export default function LoglarPage() {
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");

  React.useEffect(() => {
    fetch("/api/activity?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (d.logs) setLogs(d.logs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uniqueActions = React.useMemo(() => {
    const set = new Set(logs.map((l) => l.action).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "tr", { sensitivity: "base" }));
  }, [logs]);

  const filtered = React.useMemo(() => {
    let list = logs;
    if (actionFilter) {
      list = list.filter((l) => l.action === actionFilter);
    }
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (l) =>
        l.action.toLowerCase().includes(t) ||
        l.detail.toLowerCase().includes(t) ||
        l.username.toLowerCase().includes(t) ||
        (roleLabel[l.role] ?? l.role).toLowerCase().includes(t)
    );
  }, [logs, q, actionFilter]);

  const stats = React.useMemo(() => {
    const total = filtered.length;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const last24 = logs.filter((l) => new Date(l.createdAt).getTime() >= dayAgo).length;
    const staffActs = logs.filter((l) => l.role === "staff").length;
    return { total, last24, staffActs };
  }, [logs, filtered]);

  const hasTextOrActionFilter = Boolean(q.trim() || actionFilter);

  function formatWhen(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <HeaderBar
        title="Log Kayıtları"
        subtitle="Kütüphanede olan tüm işlemleri görebilirsiniz"
      />
      <div className="p-4 sm:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Gösterilen",
              value: stats.total,
              icon: Filter,
              tint: "indigo" as const,
              sub: hasTextOrActionFilter ? "Filtre sonrası" : "Tüm liste",
            },
            {
              label: "Son 24 saat",
              value: stats.last24,
              icon: Clock,
              tint: "cyan" as const,
              sub: "Tüm kayıtlar",
            },
            {
              label: "Görevli işlemi",
              value: stats.staffActs,
              icon: Shield,
              tint: "amber" as const,
              sub: "Bu sayfadaki toplam",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  s.tint === "indigo"
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                    : s.tint === "cyan"
                      ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                }`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--muted)]">{s.label}</p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">{s.value}</p>
                <p className="truncate text-[10px] text-[var(--muted)] opacity-90">{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex w-full flex-col gap-1.5 sm:mr-auto sm:w-auto sm:min-w-[min(100%,220px)]">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:justify-start">
              <ListFilter className="h-3.5 w-3.5 text-indigo-500" />
              İşlem
            </span>
            <div className="relative">
              <label htmlFor="log-action-filter" className="sr-only">
                İşlem türüne göre filtrele
              </label>
              <select
                id="log-action-filter"
                className="log-action-filter w-full cursor-pointer appearance-none rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3 pl-10 pr-10 text-sm font-medium text-[var(--foreground)] shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                disabled={loading || logs.length === 0}
              >
                <option value="">Tüm işlemler</option>
                {uniqueActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] opacity-80" />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 sm:ml-auto sm:w-auto sm:min-w-[min(100%,320px)] sm:max-w-lg">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:justify-end">
              <Search className="h-3.5 w-3.5 text-indigo-500" />
              Arama
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3 pl-10 pr-10 text-[var(--foreground)] shadow-sm outline-none ring-indigo-500/20 transition focus:ring-2"
                placeholder="İşlem, detay, kullanıcı veya rol ara…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Loglarda ara"
              />
              {q && (
                <button
                  type="button"
                  aria-label="Aramayı temizle"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--background)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Loglar yükleniyor…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card)]/50 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <History className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {logs.length === 0 ? "Henüz log yok" : "Eşleşen kayıt yok"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
              {logs.length === 0
                ? "Sistemde işlem yapıldıkça kayıtlar burada listelenir."
                : "Arama veya işlem filtresini değiştirin; gerekirse sıfırlayın."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l, i) => {
              const Icon = logIcon(l.action);
              const rt = roleTint(l.role);
              return (
                <motion.article
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.4) }}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm transition hover:border-indigo-200/60 hover:shadow-md dark:hover:border-indigo-500/20"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 dark:from-indigo-500/20 dark:to-violet-500/15 dark:text-indigo-300">
                      <Icon className="h-5 w-5 opacity-90" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2 gap-y-1">
                        <h3 className="text-base font-semibold leading-snug text-[var(--foreground)]">{l.action}</h3>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            rt === "violet"
                              ? "bg-violet-500/15 text-violet-800 dark:text-violet-300"
                              : rt === "indigo"
                                ? "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300"
                                : "bg-slate-500/12 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {roleLabel[l.role] ?? l.role}
                        </span>
                      </div>
                      {l.detail ? (
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--muted)]">
                          {l.detail}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                          <User className="h-3.5 w-3.5 text-indigo-500 opacity-90" />
                          {l.username}
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-amber-600 opacity-80 dark:text-amber-400" />
                          {formatWhen(l.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
