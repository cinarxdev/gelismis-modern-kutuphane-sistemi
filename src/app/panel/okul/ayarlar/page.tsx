"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HeaderBar } from "@/components/panel/header-bar";
import { Loader2, Lock, Layers, Plus, X, RefreshCw, ImageIcon, Trash2, Upload } from "lucide-react";

export default function OkulAyarlarPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [barcodeEnabled, setBarcodeEnabled] = React.useState(true);
  const [defaultLoanDays, setDefaultLoanDays] = React.useState(14);
  const [loanDaysLocked, setLoanDaysLocked] = React.useState(false);
  const [maxLoanExtensions, setMaxLoanExtensions] = React.useState(2);
  const [shelves, setShelves] = React.useState<string[]>([]);
  const [newShelf, setNewShelf] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const [hasLogo, setHasLogo] = React.useState(false);
  const [logoVersion, setLogoVersion] = React.useState(0);
  const [isSchoolAdmin, setIsSchoolAdmin] = React.useState(false);
  const [logoBusy, setLogoBusy] = React.useState(false);
  const [logoErr, setLogoErr] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    Promise.all([fetch("/api/school/settings"), fetch("/api/auth/me")])
      .then(async ([rs, rm]) => {
        const d = await rs.json();
        const m = await rm.json();
        if (d.school) {
          setName(d.school.name);
          setBarcodeEnabled(d.school.barcodeEnabled);
          setDefaultLoanDays(d.school.defaultLoanDays);
          setLoanDaysLocked(Boolean(d.school.loanDaysLocked));
          setMaxLoanExtensions(
            typeof d.school.maxLoanExtensions === "number" ? d.school.maxLoanExtensions : 2
          );
          setShelves(Array.isArray(d.school.shelves) ? d.school.shelves : []);
          setHasLogo(Boolean(d.school.hasLogo));
        }
        if (m.user?.role === "school_admin") setIsSchoolAdmin(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function openLogoFileDialog() {
    setLogoErr("");
    fileRef.current?.click();
  }

  async function onLogoFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const f = input.files?.[0];
    if (!f) return;
    setLogoErr("");
    if (f.size > 10 * 1024 * 1024) {
      setLogoErr("En fazla 10 MB");
      input.value = "";
      return;
    }
    setLogoBusy(true);
    const fd = new FormData();
    fd.set("file", f);
    const res = await fetch("/api/school/logo", { method: "POST", body: fd });
    setLogoBusy(false);
    input.value = "";
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLogoErr(j.error ?? "Yüklenemedi");
      return;
    }
    setHasLogo(true);
    setLogoVersion((v) => v + 1);
    router.refresh();
  }

  async function removeLogo() {
    setLogoErr("");
    if (!hasLogo) return;
    setLogoBusy(true);
    const res = await fetch("/api/school/logo", { method: "DELETE" });
    setLogoBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLogoErr(j.error ?? "Kaldırılamadı");
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    setHasLogo(false);
    setLogoVersion((v) => v + 1);
    router.refresh();
  }

  function addShelf() {
    const t = newShelf.trim();
    if (!t || t.length > 64) return;
    if (shelves.includes(t)) {
      setNewShelf("");
      return;
    }
    if (shelves.length >= 120) return;
    setShelves((prev) => [...prev, t]);
    setNewShelf("");
  }

  function removeShelf(label: string) {
    setShelves((prev) => prev.filter((s) => s !== label));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setSaving(true);
    const res = await fetch("/api/school/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        barcodeEnabled,
        defaultLoanDays,
        loanDaysLocked,
        maxLoanExtensions: Math.min(20, Math.max(0, Math.floor(maxLoanExtensions))),
        shelves,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(data.error ?? "Kaydedilemedi");
      return;
    }
    if (data.school?.shelves) setShelves(data.school.shelves);
    setMsg("Ayarlar güncellendi.");
  }

  return (
    <>
      <HeaderBar title="Okul Ayarları" subtitle="Raf listesi, barkod modu ve ödünç süresi" />
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Ayarlar yükleniyor…</p>
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={onSubmit}
            className="mx-auto max-w-4xl space-y-6"
          >
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  <ImageIcon className="h-4 w-4" />
                </span>
                Okul logosu
              </h2>
              <p className="mb-4 text-sm text-[var(--muted)]">
                Okul logonuz, yan menünün sol üst kısmında okul isminin yanında görünür. Desteklenen formatlar:
                JPEG, PNG, WebP ve GIF (Maksimum 10 MB).
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--background)]">
                  {hasLogo ? (
                    <Image
                      src={`/api/school/logo?v=${logoVersion}`}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="112px"
                      unoptimized
                    />
                  ) : (
                    <span className="px-2 text-center text-xs text-[var(--muted)]">Logo yok</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  {isSchoolAdmin ? (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                        className="hidden"
                        onChange={(e) => void onLogoFileSelected(e)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={logoBusy}
                          onClick={openLogoFileDialog}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {logoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Yükle
                        </button>
                        {hasLogo && (
                          <button
                            type="button"
                            disabled={logoBusy}
                            onClick={() => void removeLogo()}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Kaldır
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      Logoyu yalnızca okul yöneticisi yükleyebilir veya kaldırabilir.
                    </p>
                  )}
                  {logoErr && <p className="text-sm text-[var(--danger)]">{logoErr}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  <Layers className="h-4 w-4" />
                </span>
                Raflar
              </h2>
              <p className="mb-4 text-sm text-[var(--muted)]">
                Kitap eklerken yalnızca burada tanımlı raflardan seçim yapılır. Önce rafları kaydedin veya güncel
                listeyi kaydetmeden önce ekleyin.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-sm font-medium">Yeni raf etiketi</label>
                  <input
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 font-mono text-sm"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addShelf();
                      }
                    }}
                    placeholder="Örn. A-3, R2-12"
                    maxLength={64}
                  />
                </div>
                <button
                  type="button"
                  onClick={addShelf}
                  disabled={!newShelf.trim() || shelves.length >= 120}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25"
                >
                  <Plus className="h-4 w-4" />
                  Listeye ekle
                </button>
              </div>
              {shelves.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--background)]/40 px-4 py-6 text-center text-sm text-[var(--muted)]">
                  Henüz raf yok. Etiket yazıp &quot;Listeye ekle&quot; ile ekleyin; ardından sayfanın altından
                  kaydedin.
                </p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {shelves.map((s) => (
                    <li
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200/80 bg-fuchsia-50 px-3 py-1.5 font-mono text-sm font-medium text-fuchsia-900 dark:border-fuchsia-500/25 dark:bg-fuchsia-500/10 dark:text-fuchsia-200"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeShelf(s)}
                        className="rounded-full p-0.5 text-fuchsia-700 transition hover:bg-fuchsia-200/80 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/20"
                        aria-label={`${s} kaldır`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-[var(--muted)]">
                En fazla 120 raf; etiket başına en fazla 64 karakter. {shelves.length}/120
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">Genel</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Okul adı</label>
                  <input
                    required
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={barcodeEnabled}
                    onChange={(e) => setBarcodeEnabled(e.target.checked)}
                  />
                  Barkodlu kütüphane (kapalıysa barkod opsiyonel, ödünçte listeden seçim)
                </label>
                <div>
                  <label className="mb-1 block text-sm font-medium">Varsayılan ödünç süresi (gün)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    className="w-full max-w-xs rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={defaultLoanDays}
                    onChange={(e) => setDefaultLoanDays(Number(e.target.value) || 14)}
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/50 p-4 text-sm transition hover:border-indigo-500/30">
                  <input
                    type="checkbox"
                    checked={loanDaysLocked}
                    onChange={(e) => setLoanDaysLocked(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                      <Lock className="h-3.5 w-3.5 text-indigo-500" />
                      Varsayılan süreyi kilitle
                    </span>
                    <span className="mt-1 block text-[var(--muted)]">
                      Açıkken okul yöneticisi ve görevli hesapları ödünç verirken gün sayısını değiştiremez; yalnızca
                      bu varsayılan kullanılır. Okul yöneticisi her zaman buradan varsayılan süreyi güncelleyebilir.
                    </span>
                  </span>
                </label>
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)]/50 p-4">
                  <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                    <RefreshCw className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    Ödünç süresi uzatma limiti
                  </label>
                  <p className="mb-3 text-xs text-[var(--muted)]">
                    Aynı ödünç kaydı için öğrenci/kitap bazında en fazla kaç kez süre uzatılabileceğini belirler
                    (ör. 2 ise iki kez uzatıldıktan sonra üçüncü istek reddedilir). 0 seçilirse süre uzatma tamamen
                    kapatılır.
                  </p>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    required
                    className="w-full max-w-xs rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={maxLoanExtensions}
                    onChange={(e) => setMaxLoanExtensions(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
            {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
            <motion.button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60 sm:max-w-md"
              whileTap={{ scale: 0.99 }}
            >
              {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Tüm ayarları kaydet"}
            </motion.button>
          </motion.form>
        )}
      </div>
    </>
  );
}
