"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2,
  Trash2,
  Search,
  Library,
  BookOpen,
  Filter,
  X,
  Hash,
  Building2,
  FileText,
  Calendar,
  Layers,
  PackageX,
} from "lucide-react";

type Book = {
  id: string;
  title: string;
  author: string;
  publicationDate: string | null;
  publisher: string | null;
  pageCount: number | null;
  barcode: string | null;
  shelfNumber: string | null;
  isAvailable: boolean;
  isLost: boolean;
};

type Availability = "all" | "available" | "loaned" | "lost";

export default function KitaplarPage() {
  const [q, setQ] = React.useState("");
  const [shelfFilter, setShelfFilter] = React.useState("");
  const [shelfOptions, setShelfOptions] = React.useState<string[]>([]);
  const [availability, setAvailability] = React.useState<Availability>("all");
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [delId, setDelId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Book | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (shelfFilter.trim()) params.set("shelf", shelfFilter.trim());
    if (availability === "lost") params.set("lost", "true");
    else {
      if (availability === "available") params.set("available", "true");
      if (availability === "loaned") params.set("available", "false");
    }
    const qs = params.toString();
    const res = await fetch(`/api/books${qs ? `?${qs}` : ""}`);
    const data = await res.json();
    if (data.books) setBooks(data.books);
    setLoading(false);
  }, [q, shelfFilter, availability]);

  const refreshShelves = React.useCallback(async () => {
    const r = await fetch("/api/books/shelves");
    const d = await r.json();
    if (Array.isArray(d.shelves)) setShelfOptions(d.shelves);
  }, []);

  React.useEffect(() => {
    void refreshShelves();
  }, [refreshShelves]);

  React.useEffect(() => {
    const t = setTimeout(() => void load(), q ? 280 : 0);
    return () => clearTimeout(t);
  }, [q, shelfFilter, availability, load]);

  React.useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !delId) setPendingDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, delId]);

  const stats = React.useMemo(() => {
    const total = books.length;
    const lost = books.filter((b) => b.isLost).length;
    const avail = books.filter((b) => b.isAvailable && !b.isLost).length;
    const out = books.filter((b) => !b.isAvailable && !b.isLost).length;
    return { total, avail, out, lost };
  }, [books]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDelId(id);
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPendingDelete(null);
        await load();
        void refreshShelves();
      }
    } finally {
      setDelId(null);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }

  const filterTabs: { key: Availability; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "available", label: "Müsait" },
    { key: "loaned", label: "Ödünçte" },
    { key: "lost", label: "Kayıp" },
  ];

  return (
    <>
      <HeaderBar title="Kitap Listesi" subtitle="Kayıtlı kitapları arayın, filtreleyin ve yönetin" />
      <div className="p-4 sm:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Listelenen", value: stats.total, icon: Library, tint: "indigo" },
            { label: "Müsait", value: stats.avail, icon: BookOpen, tint: "emerald" },
            { label: "Ödünçte", value: stats.out, icon: BookOpen, tint: "amber" },
            { label: "Kayıp", value: stats.lost, icon: PackageX, tint: "rose" },
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
                    : s.tint === "emerald"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-300"
                      : s.tint === "rose"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-500/18 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/18 dark:text-amber-300"
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

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3 pl-10 pr-10 text-[var(--foreground)] outline-none ring-indigo-500/20 transition focus:ring-2"
              placeholder="Başlık, yazar, barkod veya raf ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                aria-label="Temizle"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--background)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <Filter className="h-3.5 w-3.5" />
              Durum
            </span>
            <div className="flex rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAvailability(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    availability === tab.key
                      ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            <Layers className="h-3.5 w-3.5 text-fuchsia-600 opacity-90 dark:text-fuchsia-400" />
            Raf
          </span>
          <select
            value={shelfFilter}
            onChange={(e) => setShelfFilter(e.target.value)}
            className="min-w-[200px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-indigo-500/20 focus:ring-2"
          >
            <option value="">Tüm raflar</option>
            {shelfOptions.map((s) => (
              <option key={s} value={s}>
                Raf {s}
              </option>
            ))}
          </select>
          {shelfFilter && (
            <button
              type="button"
              onClick={() => setShelfFilter("")}
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Raf filtresini kaldır
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Kitaplar yükleniyor…</p>
          </div>
        ) : books.length === 0 ? (
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
              Arama veya filtreyi değiştirin; yeni kitap eklemek için &quot;Kitap Ekle&quot; sayfasını kullanın.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {books.map((b, i) => (
              <motion.article
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.35) }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm transition hover:border-indigo-200/60 hover:shadow-md dark:hover:border-indigo-500/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="hidden h-[72px] w-[52px] shrink-0 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/15 sm:flex sm:items-center sm:justify-center">
                      <Library className="h-7 w-7 text-indigo-500 opacity-70 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="text-base font-semibold leading-snug text-[var(--foreground)]">{b.title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            b.isLost
                              ? "bg-rose-500/15 text-rose-800 dark:text-rose-300"
                              : b.isAvailable
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-800 dark:text-amber-400"
                          }`}
                        >
                          {b.isLost ? (
                            <span className="inline-flex items-center gap-1">
                              <PackageX className="h-3 w-3" />
                              Kayıp
                            </span>
                          ) : b.isAvailable ? (
                            "Müsait"
                          ) : (
                            "Ödünçte"
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">{b.author}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
                        {b.shelfNumber && (
                          <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-fuchsia-700 dark:text-fuchsia-400">
                            <Layers className="h-3.5 w-3.5 opacity-90" />
                            Raf {b.shelfNumber}
                          </span>
                        )}
                        {b.barcode && (
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            <Hash className="h-3.5 w-3.5 text-indigo-500 opacity-80" />
                            {b.barcode}
                          </span>
                        )}
                        {b.publisher && (
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-violet-500 opacity-80" />
                            {b.publisher}
                          </span>
                        )}
                        {b.pageCount != null && (
                          <span className="inline-flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-cyan-600 opacity-80 dark:text-cyan-400" />
                            {b.pageCount} sayfa
                          </span>
                        )}
                        {formatDate(b.publicationDate) && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-amber-600 opacity-80 dark:text-amber-400" />
                            {formatDate(b.publicationDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 border-t border-[var(--card-border)] pt-3 lg:border-t-0 lg:pt-0">
                    <button
                      type="button"
                      disabled={(!b.isAvailable && !b.isLost) || delId === b.id}
                      onClick={() => setPendingDelete(b)}
                      title={
                        b.isAvailable || b.isLost ? "Kitabı sil" : "Ödünçteyken silinemez"
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                    >
                      {delId === b.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Sil
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !delId && setPendingDelete(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-book-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 id="delete-book-title" className="text-lg font-semibold text-[var(--foreground)]">
                Bu kitabı silmek istiyor musunuz?
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--foreground)]">{pendingDelete.title}</span>
                <span className="text-[var(--muted)]"> · {pendingDelete.author}</span>
                {pendingDelete.shelfNumber && (
                  <span className="mt-1 block text-xs font-mono">Raf: {pendingDelete.shelfNumber}</span>
                )}
                {pendingDelete.barcode && (
                  <span className="mt-1 block font-mono text-xs">Barkod: {pendingDelete.barcode}</span>
                )}
              </p>
              <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200/90">
                Bu işlem geri alınamaz. Müsait veya kayıp kitaplar silinebilir; ödünçteki kitaplar silinemez.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={!!delId}
                  onClick={() => setPendingDelete(null)}
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={!!delId || (!pendingDelete.isAvailable && !pendingDelete.isLost)}
                  onClick={() => void confirmDelete()}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-500"
                >
                  {delId ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Siliniyor…
                    </span>
                  ) : (
                    "Evet, sil"
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
