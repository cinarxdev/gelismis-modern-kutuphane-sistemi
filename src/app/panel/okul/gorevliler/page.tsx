"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  AtSign,
  Lock,
  Calendar,
  Power,
  CheckCircle2,
  UserCog,
  Clock,
} from "lucide-react";

type Staff = { id: string; username: string; isActive: boolean; createdAt: string; lastLogin?: string };

function initials(username: string) {
  const t = username.trim();
  if (!t) return "?";
  if (t.length === 1) return t.toUpperCase();
  return (t[0] + t[1]).toUpperCase();
}

export default function GorevlilerPage() {
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [pendingPwd, setPendingPwd] = React.useState<Staff | null>(null);
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [pwdErr, setPwdErr] = React.useState("");
  const [pwdSaving, setPwdSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/staff");
    const data = await res.json();
    if (data.staff) setStaff(data.staff);
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
  }, []);

  React.useEffect(() => {
    if (!pendingPwd) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pwdSaving) {
        setPendingPwd(null);
        setNewPwd("");
        setConfirmPwd("");
        setPwdErr("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingPwd, pwdSaving]);

  const stats = React.useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.isActive).length;
    const passive = total - active;
    return { total, active, passive };
  }, [staff]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(data.error ?? "Eklenemedi");
      return;
    }
    setUsername("");
    setPassword("");
    void load();
  }

  async function toggleActive(s: Staff) {
    setTogglingId(s.id);
    try {
      await fetch(`/api/staff/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  function openPwdModal(s: Staff) {
    setPwdErr("");
    setNewPwd("");
    setConfirmPwd("");
    setPendingPwd(s);
  }

  async function submitPwdReset() {
    if (!pendingPwd) return;
    setPwdErr("");
    if (newPwd.length < 6) {
      setPwdErr("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdErr("Şifreler eşleşmiyor.");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch(`/api/staff/${pendingPwd.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdErr(data.error ?? "Güncellenemedi");
        return;
      }
      setPendingPwd(null);
      setNewPwd("");
      setConfirmPwd("");
      await load();
    } finally {
      setPwdSaving(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }

  function formatDateTime(iso?: string) {
    if (!iso) return "Henüz giriş yapılmadı";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("tr-TR", { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }

  return (
    <>
      <HeaderBar
        title="Görevliler"
        subtitle="Kütüphane görevlisi hesabı ekleyin ve yönetin"
      />
      <div className="p-4 sm:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Toplam görevli", value: stats.total, icon: Users, tint: "indigo" as const },
            { label: "Aktif", value: stats.active, icon: UserCheck, tint: "emerald" as const },
            { label: "Pasif", value: stats.passive, icon: UserX, tint: "amber" as const },
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
                    : s.tint === "emerald"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-500/18 dark:text-amber-200"
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

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">Yeni görevli ekle</h2>

              </div>
            </div>

          </div>
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="sm:col-span-1 lg:col-span-4">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <AtSign className="h-3.5 w-3.5 text-indigo-500" />
                Kullanıcı adı
              </label>
              <input
                required
                minLength={2}
                autoComplete="off"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 transition focus:ring-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ornek.gorevli"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-4">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <Lock className="h-3.5 w-3.5 text-violet-500" />
                Şifre
              </label>
              <input
                required
                type="password"
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/15 transition focus:ring-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <motion.button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                whileTap={{ scale: 0.99 }}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                Görevli oluştur
              </motion.button>
            </div>
            {err && (
              <p className="text-sm text-[var(--danger)] sm:col-span-2 lg:col-span-12">{err}</p>
            )}
          </form>
        </motion.section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Görevliler yükleniyor…</p>
          </div>
        ) : staff.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card)]/50 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <UserCog className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">Henüz görevli yok</p>
            <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
              Yukarıdaki formdan ilk görevli hesabını oluşturun. Görevliler kitap ödünç/iade ve öğrenci işlemlerinde
              kullanılır (okul ayarlarına göre kısıtlı olabilir).
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              Hesap listesi
            </h2>
            {staff.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.35) }}
                className="group overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm transition hover:border-indigo-200/60 hover:shadow-md dark:hover:border-indigo-500/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-bold text-slate-700 dark:from-slate-600 dark:to-slate-700 dark:text-slate-100">
                      {initials(s.username)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mono text-base font-semibold text-[var(--foreground)]">{s.username}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            s.isActive
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                              : "bg-slate-500/15 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {s.isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3" />
                              Pasif
                            </>
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted)]">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-amber-600 opacity-80 dark:text-amber-400" />
                          Eklenme {formatDate(s.createdAt)}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-500 opacity-80 dark:text-indigo-400" />
                          Son Giriş: {formatDateTime(s.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--card-border)] pt-3 lg:border-t-0 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => openPwdModal(s)}
                      disabled={togglingId === s.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/50 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-indigo-300/50 hover:bg-[var(--background)] disabled:opacity-50 dark:hover:border-indigo-500/30 lg:flex-none"
                    >
                      <KeyRound className="h-4 w-4 text-indigo-500" />
                      Şifre sıfırla
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(s)}
                      disabled={togglingId === s.id}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 lg:flex-none ${
                        s.isActive
                          ? "border border-amber-200/90 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                          : "border border-emerald-200/90 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                      }`}
                    >
                      {togglingId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                      {s.isActive ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {pendingPwd && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!pwdSaving) {
                setPendingPwd(null);
                setNewPwd("");
                setConfirmPwd("");
                setPwdErr("");
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pwd-reset-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 id="pwd-reset-title" className="text-lg font-semibold text-[var(--foreground)]">
                Şifre sıfırla
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                <span className="font-mono font-medium text-[var(--foreground)]">{pendingPwd.username}</span> için yeni
                şifre belirleyin.
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Yeni şifre</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/20 focus:ring-2"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Şifre tekrar</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-indigo-500/20 focus:ring-2"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Tekrar girin"
                  />
                </div>
              </div>
              {pwdErr && <p className="mt-3 text-sm text-[var(--danger)]">{pwdErr}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={pwdSaving}
                  onClick={() => {
                    setPendingPwd(null);
                    setNewPwd("");
                    setConfirmPwd("");
                    setPwdErr("");
                  }}
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={pwdSaving}
                  onClick={() => void submitPwdReset()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
