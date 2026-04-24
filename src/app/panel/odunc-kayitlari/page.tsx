"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2,
  RotateCcw,
  Library,
  BookOpen,
  CheckCircle2,
  Filter,
  User,
  Calendar,
  Clock,
  Hash,
  AlertTriangle,
  ClipboardList,
  CalendarPlus,
  RefreshCw,
  PackageX,
} from "lucide-react";

type ExtensionEntry = {
  at: string;
  daysAdded: number;
  previousDueDate: string;
  newDueDate: string;
};

type Loan = {
  id: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookBarcode?: string | null;
  studentName?: string;
  studentNo?: string | null;
  gradeClass?: string | null;
  issuedBy?: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
  lostAt?: string | null;
  extensionCount?: number;
  extensionHistory?: ExtensionEntry[];
};

type TabKey = "all" | "active" | "returned" | "overdue" | "lost";

const tabs: { key: TabKey; label: string }[] = [
  { key: "active", label: "Aktif" },
  { key: "overdue", label: "Geciken" },
  { key: "returned", label: "İade" },
  { key: "lost", label: "Kayıp" },
  { key: "all", label: "Tümü" },
];

const EXTEND_OPTIONS: { days: 3 | 7 | 14; label: string; hint: string }[] = [
  { days: 3, label: "3 gün", hint: "Kısa ek süre" },
  { days: 7, label: "1 hafta", hint: "+7 gün" },
  { days: 14, label: "2 hafta", hint: "+14 gün" },
];

export default function OduncKayitlariPage() {
  const [tab, setTab] = React.useState<TabKey>("active");
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [maxLoanExtensions, setMaxLoanExtensions] = React.useState(2);
  const [returningId, setReturningId] = React.useState<string | null>(null);
  const [extendingId, setExtendingId] = React.useState<string | null>(null);
  const [pendingReturn, setPendingReturn] = React.useState<Loan | null>(null);
  const [returnErr, setReturnErr] = React.useState("");
  const [pendingExtend, setPendingExtend] = React.useState<Loan | null>(null);
  const [selectedExtendDays, setSelectedExtendDays] = React.useState<3 | 7 | 14 | null>(null);
  const [extendErr, setExtendErr] = React.useState("");
  const [markingLostId, setMarkingLostId] = React.useState<string | null>(null);
  const [pendingLost, setPendingLost] = React.useState<Loan | null>(null);
  const [lostErr, setLostErr] = React.useState("");

  React.useEffect(() => {
    fetch("/api/school/settings")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.school?.maxLoanExtensions === "number") {
          setMaxLoanExtensions(d.school.maxLoanExtensions);
        }
      })
      .catch(() => {});
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const query =
      tab === "all"
        ? ""
        : tab === "overdue"
          ? "?status=overdue"
          : tab === "lost"
            ? "?status=lost"
            : `?status=${tab === "active" ? "active" : "returned"}`;
    const res = await fetch(`/api/loans${query}`);
    const data = await res.json();
    if (data.loans) setLoans(data.loans);
    setLoading(false);
  }, [tab]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const busy = !!returningId || !!extendingId || !!markingLostId;

  React.useEffect(() => {
    if (!pendingReturn && !pendingExtend && !pendingLost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        setPendingReturn(null);
        setPendingExtend(null);
        setSelectedExtendDays(null);
        setExtendErr("");
        setPendingLost(null);
        setLostErr("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingReturn, pendingExtend, pendingLost, busy]);

  const stats = React.useMemo(() => {
    const total = loans.length;
    const ongoing = loans.filter((l) => l.status === "active" || l.status === "overdue").length;
    const returned = loans.filter((l) => l.status === "returned").length;
    const lost = loans.filter((l) => l.status === "lost").length;
    return { total, ongoing, returned, lost };
  }, [loans]);

  async function confirmReturn() {
    if (!pendingReturn) return;
    const id = pendingReturn.id;
    setReturnErr("");
    setReturningId(id);
    try {
      const res = await fetch(`/api/loans/${id}/return`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReturnErr((data as { error?: string }).error ?? "İade işlemi başarısız");
        return;
      }
      setPendingReturn(null);
      await load();
    } finally {
      setReturningId(null);
    }
  }

  async function confirmExtend() {
    if (!pendingExtend || selectedExtendDays == null) return;
    const id = pendingExtend.id;
    setExtendErr("");
    setExtendingId(id);
    try {
      const res = await fetch(`/api/loans/${id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: selectedExtendDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExtendErr((data as { error?: string }).error ?? "Süre uzatılamadı");
        return;
      }
      setPendingExtend(null);
      setSelectedExtendDays(null);
      await load();
    } finally {
      setExtendingId(null);
    }
  }

  async function confirmMarkLost() {
    if (!pendingLost) return;
    const id = pendingLost.id;
    setLostErr("");
    setMarkingLostId(id);
    try {
      const res = await fetch(`/api/loans/${id}/mark-lost`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLostErr((data as { error?: string }).error ?? "İşlem başarısız");
        return;
      }
      setPendingLost(null);
      await load();
    } finally {
      setMarkingLostId(null);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openExtendModal(l: Loan) {
    setExtendErr("");
    setSelectedExtendDays(null);
    setPendingExtend(l);
  }

  const extendAllowed = maxLoanExtensions > 0;

  return (
    <>
      <HeaderBar
        title="Ödünç Kayıtları"
        subtitle="Aktif ödünçleri görüntüleyin, süre uzatın, gecikenleri takip edin, iade alın"
      />
      <div className="p-4 sm:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Bu listede", value: stats.total, icon: ClipboardList, tint: "indigo" as const },
            { label: "Devam eden", value: stats.ongoing, icon: BookOpen, tint: "amber" as const },
            { label: "İade (listede)", value: stats.returned, icon: CheckCircle2, tint: "emerald" as const },
            { label: "Kayıp (listede)", value: stats.lost, icon: PackageX, tint: "rose" as const },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  s.tint === "indigo"
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                    : s.tint === "amber"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/18 dark:text-amber-300"
                      : s.tint === "rose"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-500/18 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-300"
                }`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">{s.label}</p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            <Filter className="h-3.5 w-3.5" />
            Görünüm
          </span>
          <div className="flex flex-wrap rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  tab === t.key
                    ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Kayıtlar yükleniyor…</p>
          </div>
        ) : loans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card)]/50 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Library className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">Kayıt bulunamadı</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
              Bu filtrede ödünç kaydı yok. Farklı bir sekme seçin veya yeni ödünç için &quot;Ödünç Ver&quot; sayfasını kullanın.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {loans.map((l, i) => {
              const extCount = l.extensionCount ?? 0;
              const lastExt = l.extensionHistory?.length
                ? l.extensionHistory[l.extensionHistory.length - 1]
                : null;
              const remainingExt = Math.max(0, maxLoanExtensions - extCount);
              const canExtendThis =
                extendAllowed &&
                l.status !== "returned" &&
                l.status !== "lost" &&
                extCount < maxLoanExtensions;

              return (
                <motion.article
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.35) }}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm transition hover:border-indigo-200/60 hover:shadow-md dark:hover:border-indigo-500/20"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="hidden h-[72px] w-[52px] shrink-0 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/15 sm:flex sm:items-center sm:justify-center">
                        <Library className="h-7 w-7 text-indigo-500 opacity-70 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <h3 className="text-base font-semibold leading-snug text-[var(--foreground)]">
                            {l.bookTitle ?? "—"}
                          </h3>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              l.status === "lost"
                                ? "bg-rose-500/15 text-rose-800 dark:text-rose-300"
                                : l.status === "overdue"
                                  ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                  : l.status === "returned"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-amber-500/15 text-amber-800 dark:text-amber-400"
                            }`}
                          >
                            {l.status === "lost" ? (
                              <span className="inline-flex items-center gap-1">
                                <PackageX className="h-3 w-3" />
                                Kayıp
                              </span>
                            ) : l.status === "overdue" ? (
                              <span className="inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Gecikmiş
                              </span>
                            ) : l.status === "returned" ? (
                              "İade edildi"
                            ) : (
                              "Aktif"
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">{l.bookAuthor}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                            <User className="h-3.5 w-3.5 text-violet-500 opacity-90" />
                            {l.studentName}
                            {l.gradeClass && (
                              <span className="font-normal text-[var(--muted)]">· {l.gradeClass}</span>
                            )}
                          </span>
                          {l.bookBarcode && (
                            <span className="inline-flex items-center gap-1.5 font-mono">
                              <Hash className="h-3.5 w-3.5 text-indigo-500 opacity-80" />
                              {l.bookBarcode}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-cyan-600 opacity-80 dark:text-cyan-400" />
                            Alınış {formatDate(l.borrowedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-600 opacity-80 dark:text-amber-400" />
                            Son teslim {formatDate(l.dueDate)}
                          </span>
                          {l.issuedBy && (
                            <span className="text-[var(--muted)]">Veren: {l.issuedBy}</span>
                          )}
                        </div>

                        {extCount > 0 && (
                          <div className="mt-3 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3 py-2.5 text-xs leading-relaxed text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100/95">
                            <p className="flex items-start gap-1.5 font-medium text-sky-900 dark:text-sky-200">
                              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {l.status === "returned" || l.status === "lost" ? (
                                <>
                                  Bu ödünç döneminde toplam <strong>{extCount}</strong> kez süre uzatıldı.
                                  {lastExt && (
                                    <span className="mt-1 block font-normal text-sky-800/90 dark:text-sky-300/90">
                                      Son uzatılmış teslim tarihi: {formatDate(lastExt.newDueDate)} (
                                      {formatDateTime(lastExt.at)})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  Son teslim <strong>{formatDate(l.dueDate)}</strong> tarihine kadar uzatıldı.
                                  <span className="mt-1 block font-normal text-sky-800/90 dark:text-sky-300/90">
                                    Toplam <strong>{extCount}</strong> kez süre uzatıldı
                                    {lastExt ? (
                                      <>
                                        . Son işlem: +{lastExt.daysAdded} gün ({formatDateTime(lastExt.at)})
                                      </>
                                    ) : null}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        )}

                        {l.status === "lost" && l.lostAt && (
                          <div className="mt-3 rounded-xl border border-rose-200/90 bg-rose-50/90 px-3 py-2.5 text-xs leading-relaxed text-rose-950 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100/95">
                            <p className="flex items-start gap-1.5 font-medium text-rose-900 dark:text-rose-200">
                              <PackageX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              Kopya kayıp olarak işaretlendi ({formatDateTime(l.lostAt)}). Kitap listesinde
                              &quot;Kayıp&quot; görünür; öğrencinin kayıp kitap sayacı bir artırıldı.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--card-border)] pt-3 sm:flex-row lg:flex-col lg:border-t-0 lg:pt-0 xl:flex-row xl:flex-wrap">
                      {l.status !== "returned" && l.status !== "lost" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openExtendModal(l)}
                            disabled={
                              !canExtendThis ||
                              returningId === l.id ||
                              extendingId === l.id ||
                              markingLostId === l.id
                            }
                            title={
                              !extendAllowed
                                ? "Okul ayarlarında süre uzatma kapalı"
                                : !canExtendThis
                                  ? `Uzatma limiti doldu (en fazla ${maxLoanExtensions})`
                                  : `${remainingExt} uzatma hakkı kaldı`
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200/90 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20 sm:flex-1 lg:w-full xl:flex-1"
                          >
                            <CalendarPlus className="h-4 w-4" />
                            Süreyi uzat
                            {extendAllowed && (
                              <span className="tabular-nums opacity-80">({remainingExt}/{maxLoanExtensions})</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReturnErr("");
                              setPendingReturn(l);
                            }}
                            disabled={
                              returningId === l.id || extendingId === l.id || markingLostId === l.id
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 sm:flex-1 lg:w-full xl:flex-1"
                          >
                            {returningId === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            İade al
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLostErr("");
                              setPendingLost(l);
                            }}
                            disabled={
                              returningId === l.id || extendingId === l.id || markingLostId === l.id
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20 sm:flex-1 lg:w-full xl:flex-1"
                          >
                            {markingLostId === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PackageX className="h-4 w-4" />
                            )}
                            Kayıp işaretle
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {pendingReturn && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setPendingReturn(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="return-loan-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <RotateCcw className="h-6 w-6" />
              </div>
              <h2 id="return-loan-title" className="text-lg font-semibold text-[var(--foreground)]">
                İadeyi onaylıyor musunuz?
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Bu ödünç kaydı kapatılacak ve kitap kopyası tekrar müsait olarak işaretlenecek.
              </p>
              <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 p-4 text-sm">
                <p className="font-semibold text-[var(--foreground)]">{pendingReturn.bookTitle ?? "Kitap"}</p>
                <p className="text-[var(--muted)]">{pendingReturn.bookAuthor}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[var(--foreground)]">
                  <User className="h-3.5 w-3.5 text-violet-500" />
                  {pendingReturn.studentName}
                  {pendingReturn.gradeClass && (
                    <span className="text-[var(--muted)]">· {pendingReturn.gradeClass}</span>
                  )}
                </p>
                {pendingReturn.bookBarcode && (
                  <p className="mt-1 font-mono text-xs text-[var(--muted)]">Barkod: {pendingReturn.bookBarcode}</p>
                )}
              </div>
              {returnErr && <p className="mt-3 text-sm text-[var(--danger)]">{returnErr}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPendingReturn(null)}
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmReturn()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {returningId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      İşleniyor…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Evet, iade al
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingExtend && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!busy) {
                setPendingExtend(null);
                setSelectedExtendDays(null);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="extend-loan-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                <CalendarPlus className="h-6 w-6" />
              </div>
              <h2 id="extend-loan-title" className="text-lg font-semibold text-[var(--foreground)]">
                Kaç gün süreyi uzatmak istiyorsunuz?
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Mevcut son teslim tarihinin üzerine eklenecek. Okul limiti: bu kayıt için en fazla{" "}
                <strong>{maxLoanExtensions}</strong> uzatma; şu ana kadar{" "}
                <strong>{pendingExtend.extensionCount ?? 0}</strong> kez uzatıldı.
              </p>
              <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 p-3 text-sm">
                <p className="font-semibold text-[var(--foreground)]">{pendingExtend.bookTitle}</p>
                <p className="text-xs text-[var(--muted)]">{pendingExtend.studentName}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Güncel son teslim: <span className="font-medium text-[var(--foreground)]">{formatDate(pendingExtend.dueDate)}</span>
                </p>
              </div>
              <p className="mt-4 text-xs font-medium text-[var(--muted)]">Süre seçin</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {EXTEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    disabled={busy}
                    onClick={() => setSelectedExtendDays(opt.days)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition disabled:opacity-50 ${
                      selectedExtendDays === opt.days
                        ? "border-sky-500 bg-sky-500/15 text-sky-900 dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-100"
                        : "border-[var(--card-border)] bg-[var(--background)]/40 hover:border-sky-300/60 dark:hover:border-sky-500/30"
                    }`}
                  >
                    {opt.label}
                    <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">{opt.hint}</span>
                  </button>
                ))}
              </div>
              {extendErr && <p className="mt-3 text-sm text-[var(--danger)]">{extendErr}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingExtend(null);
                    setSelectedExtendDays(null);
                    setExtendErr("");
                  }}
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={busy || selectedExtendDays == null}
                  onClick={() => void confirmExtend()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500"
                >
                  {extendingId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uzatılıyor…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Süreyi uzat
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingLost && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!busy) {
                setPendingLost(null);
                setLostErr("");
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mark-lost-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                <PackageX className="h-6 w-6" />
              </div>
              <h2 id="mark-lost-title" className="text-lg font-semibold text-[var(--foreground)]">
                Kitabı kayıp olarak işaretlemek istediğinize emin misiniz?
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Kopya listede &quot;Kayıp&quot; görünecek, ödünç verilemeyecek. Bu öğrenci için kayıp kitap sayacı{" "}
                <strong>+1</strong> artacak. İşlem geri alınamaz.
              </p>
              <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 p-4 text-sm">
                <p className="font-semibold text-[var(--foreground)]">{pendingLost.bookTitle ?? "Kitap"}</p>
                <p className="text-[var(--muted)]">{pendingLost.bookAuthor}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[var(--foreground)]">
                  <User className="h-3.5 w-3.5 text-violet-500" />
                  {pendingLost.studentName}
                  {pendingLost.gradeClass && (
                    <span className="text-[var(--muted)]">· {pendingLost.gradeClass}</span>
                  )}
                </p>
              </div>
              {lostErr && <p className="mt-3 text-sm text-[var(--danger)]">{lostErr}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingLost(null);
                    setLostErr("");
                  }}
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmMarkLost()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50 dark:bg-rose-600 dark:hover:bg-rose-500"
                >
                  {markingLostId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      İşleniyor…
                    </>
                  ) : (
                    <>
                      <PackageX className="h-4 w-4" />
                      Evet, kayıp işaretle
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
