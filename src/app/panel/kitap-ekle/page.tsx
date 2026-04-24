"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2,
  BookMarked,
  User,
  Building2,
  Calendar,
  FileText,
  Layers,
  ScanBarcode,
  ChevronDown,
  Check,
  Library,
} from "lucide-react";

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean
) {
  React.useEffect(() => {
    if (!enabled) return;
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOutside, enabled]);
}

function ShelfCombobox({
  options,
  value,
  onChange,
  disabled,
  id,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const queryRef = React.useRef(query);
  queryRef.current = query;

  React.useEffect(() => {
    if (!open) setQuery(value);
  }, [open, value]);

  const closeDropdown = React.useCallback(() => {
    const t = queryRef.current.trim();
    if (t === "") onChange("");
    else if (options.includes(t)) onChange(t);
    setOpen(false);
    setQuery(t === "" ? "" : options.includes(t) ? t : value);
  }, [options, value, onChange]);

  useClickOutside(wrapRef, closeDropdown, open);

  const q = (open ? query : value).trim().toLowerCase();
  const filtered = options.filter((s) => s.toLowerCase().includes(q));

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Layers className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fuchsia-600 opacity-80 dark:text-fuchsia-400" />
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={disabled ? "Önce ayarlardan raf ekleyin" : "Yazarak ara veya listeden seç…"}
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] py-3 pl-10 pr-10 font-mono text-sm text-[var(--foreground)] outline-none ring-fuchsia-500/15 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(value);
          }}
        />
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && !disabled && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">Eşleşen raf yok</li>
          ) : (
            filtered.map((s) => (
              <li key={s} role="option" aria-selected={value === s}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-mono text-sm text-[var(--foreground)] transition hover:bg-indigo-500/10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(s);
                    setQuery(s);
                    setOpen(false);
                  }}
                >
                  {s}
                  {value === s ? <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" /> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function KitapEklePage() {
  const [school, setSchool] = React.useState<{
    barcodeEnabled: boolean;
    shelves: string[];
  } | null>(null);
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [publicationDate, setPublicationDate] = React.useState("");
  const [publisher, setPublisher] = React.useState("");
  const [pageCount, setPageCount] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [shelfNumber, setShelfNumber] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [settingsLoading, setSettingsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/school/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.school) {
          setSchool({
            barcodeEnabled: d.school.barcodeEnabled,
            shelves: Array.isArray(d.school.shelves) ? d.school.shelves : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const shelves = school?.shelves ?? [];
    if (shelfNumber && shelves.length > 0 && !shelves.includes(shelfNumber)) {
      setErr("Rafı listeden seçin veya arama ile tam eşleşen etiketi tıklayın.");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title,
        author,
        publicationDate: publicationDate || null,
        publisher: publisher || null,
        pageCount: pageCount ? Number(pageCount) : null,
        barcode: barcode || null,
        shelfNumber: shelfNumber.trim() || null,
      };
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "Kayıt başarısız");
        return;
      }
      setMsg("Kitap eklendi.");
      setTitle("");
      setAuthor("");
      setPublicationDate("");
      setPublisher("");
      setPageCount("");
      setBarcode("");
      setShelfNumber("");
    } finally {
      setLoading(false);
    }
  }

  const shelves = school?.shelves ?? [];
  const shelfDisabled = shelves.length === 0;

  return (
    <>
      <HeaderBar title="Kitap Ekle" subtitle="Her kayıt yeni bir fiziksel kitaptır" />
      <div className="p-4 sm:p-6">
        {settingsLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Okul ayarları yükleniyor…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto max-w-6xl space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm sm:p-6 lg:col-span-2"
              >
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                    <Library className="h-5 w-5" />
                  </span>
                  Kitap bilgileri
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ke-title" className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <BookMarked className="h-3.5 w-3.5 text-indigo-500" />
                      Kitap adı
                    </label>
                    <input
                      id="ke-title"
                      required
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="ke-author" className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-violet-500" />
                      Yazar
                    </label>
                    <input
                      id="ke-author"
                      required
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="ke-publisher" className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      Yayınevi (opsiyonel)
                    </label>
                    <input
                      id="ke-publisher"
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ke-date" className="mb-1 flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        Basım tarihi
                      </label>
                      <input
                        id="ke-date"
                        type="date"
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                        value={publicationDate}
                        onChange={(e) => setPublicationDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="ke-pages" className="mb-1 flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Sayfa sayısı
                      </label>
                      <input
                        id="ke-pages"
                        type="number"
                        min={1}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                        value={pageCount}
                        onChange={(e) => setPageCount(e.target.value)}
                        placeholder="Opsiyonel"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm sm:p-6"
              >
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/18 dark:text-fuchsia-300">
                    <Layers className="h-5 w-5" />
                  </span>
                  Konum ve barkod
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ke-shelf" className="mb-1 block text-sm font-medium">
                      Raf (opsiyonel)
                    </label>
                    <ShelfCombobox
                      id="ke-shelf"
                      options={shelves}
                      value={shelfNumber}
                      onChange={setShelfNumber}
                      disabled={shelfDisabled}
                    />
                    {shelfDisabled ? (
                      <p className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200/95">
                        Tanımlı raf yok. Okul yöneticisi{" "}
                        <Link
                          href="/panel/okul/ayarlar"
                          className="font-semibold text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
                        >
                          Okul Ayarları
                        </Link>
                        üzerinden raf ekleyebilir; raf olmadan da kayıt oluşturulabilir.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Yazarak filtreleyin; seçmek için listeden tıklayın. Boş bırakılabilir.
                      </p>
                    )}
                  </div>
                  {school?.barcodeEnabled ? (
                    <div>
                      <label htmlFor="ke-barcode" className="mb-1 flex items-center gap-2 text-sm font-medium">
                        <ScanBarcode className="h-3.5 w-3.5 text-indigo-500" />
                        Barkod
                      </label>
                      <input
                        id="ke-barcode"
                        required={school.barcodeEnabled}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 font-mono text-sm text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="ke-barcode-o" className="mb-1 flex items-center gap-2 text-sm font-medium">
                        <ScanBarcode className="h-3.5 w-3.5 text-[var(--muted)]" />
                        Barkod (opsiyonel)
                      </label>
                      <input
                        id="ke-barcode-o"
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 font-mono text-sm text-[var(--foreground)] outline-none ring-indigo-500/15 focus:ring-2"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                      />
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Okulunuz barkodsuz modda; barkod girmezseniz boş kalır.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"
            >
              <div className="min-w-0 flex-1">
                {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
                {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
                {!err && !msg && (
                  <p className="text-sm text-[var(--muted)]">
                    Kaydettiğinizde kitap müsait olarak listeye düşer; raf ve barkod kitap listesinde görünür.
                  </p>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60 sm:mt-0 sm:w-auto"
                whileTap={{ scale: 0.99 }}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BookMarked className="h-5 w-5 opacity-90" />}
                Kitabı kaydet
              </motion.button>
            </motion.div>
          </form>
        )}
      </div>
    </>
  );
}
