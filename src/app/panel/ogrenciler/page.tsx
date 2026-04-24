"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2, Pencil, Trash2, PackageX, Plus, Search, Users, UserPlus,
  User, GraduationCap, Hash, X, CheckCircle2, AlertTriangle,
} from "lucide-react";

type Stu = {
  id: string;
  fullName: string;
  studentNo: string | null;
  gradeClass: string | null;
  lostBooksCount: number;
};

type ModalMode = "add" | "edit" | null;

export default function OgrencilerPage() {
  const [students, setStudents] = React.useState<Stu[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [modalMode, setModalMode] = React.useState<ModalMode>(null);
  const [editTarget, setEditTarget] = React.useState<Stu | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [studentNo, setStudentNo] = React.useState("");
  const [gradeClass, setGradeClass] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState("");

  const [pendingDelete, setPendingDelete] = React.useState<Stu | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteErr, setDeleteErr] = React.useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/students");
    const data = await res.json();
    if (data.students) setStudents(data.students);
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !deleting) {
        setModalMode(null);
        setPendingDelete(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, deleting]);

  function openAddModal() {
    setEditTarget(null);
    setFullName("");
    setStudentNo("");
    setGradeClass("");
    setFormErr("");
    setModalMode("add");
  }

  function openEditModal(s: Stu) {
    setEditTarget(s);
    setFullName(s.fullName);
    setStudentNo(s.studentNo ?? "");
    setGradeClass(s.gradeClass ?? "");
    setFormErr("");
    setModalMode("edit");
  }

  function openDeleteModal(s: Stu) {
    setDeleteErr("");
    setPendingDelete(s);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setFormErr("Ad soyad zorunlu."); return; }
    setSaving(true);
    setFormErr("");
    try {
      const body = JSON.stringify({
        fullName: fullName.trim(),
        studentNo: studentNo.trim() || null,
        gradeClass: gradeClass.trim() || null,
      });
      const headers = { "Content-Type": "application/json" };

      if (modalMode === "edit" && editTarget) {
        const res = await fetch(`/api/students/${editTarget.id}`, { method: "PATCH", headers, body });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setFormErr((d as { error?: string }).error ?? "Güncelleme başarısız");
          return;
        }
      } else {
        const res = await fetch("/api/students", { method: "POST", headers, body });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setFormErr((d as { error?: string }).error ?? "Ekleme başarısız");
          return;
        }
      }
      setModalMode(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteErr("");
    try {
      const res = await fetch(`/api/students/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteErr((d as { error?: string }).error ?? "Silme başarısız");
        return;
      }
      setPendingDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.studentNo && s.studentNo.toLowerCase().includes(q)) ||
        (s.gradeClass && s.gradeClass.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const stats = React.useMemo(() => {
    const total = students.length;
    const withLost = students.filter((s) => s.lostBooksCount > 0).length;
    const uniqueClasses = new Set(students.map((s) => s.gradeClass).filter(Boolean)).size;
    return { total, withLost, uniqueClasses };
  }, [students]);

  const busy = saving || deleting;

  return (
    <>
      <HeaderBar title="Öğrenciler" subtitle="Öğrenci listesini görüntüleyin, ekleyin ve yönetin" />
      <div className="p-4 sm:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Toplam Öğrenci", value: stats.total, icon: Users, tint: "indigo" as const },
            { label: "Sınıf Sayısı", value: stats.uniqueClasses, icon: GraduationCap, tint: "violet" as const },
            { label: "Kayıp Kitabı Olan", value: stats.withLost, icon: PackageX, tint: "rose" as const },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                s.tint === "indigo" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" :
                s.tint === "violet" ? "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300" :
                "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
              }`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">{s.label}</p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-indigo-500/40 focus:ring-indigo-500/20"
              placeholder="Ad, numara veya sınıf ara…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <motion.button type="button" onClick={openAddModal} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> Yeni Öğrenci
          </motion.button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--muted)]">Öğrenciler yükleniyor…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card)]/50 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {searchQuery ? "Sonuç bulunamadı" : "Henüz öğrenci yok"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
              {searchQuery ? "Arama kriterlerinizi değiştirin." : "\"Yeni Öğrenci\" butonuyla ilk öğrenciyi ekleyin."}
            </p>
          </motion.div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--card-border)] bg-[var(--background)]/50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Ad Soyad</span>
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Numara</span>
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Sınıf</span>
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5"><PackageX className="h-3.5 w-3.5 text-rose-500" /> Kayıp</span>
                    </th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3) }}
                      className="group border-b border-[var(--card-border)] last:border-0 transition hover:bg-[var(--background)]/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-[var(--foreground)]">{s.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[var(--muted)]">{s.studentNo ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        {s.gradeClass ? (
                          <span className="inline-flex items-center rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                            {s.gradeClass}
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.lostBooksCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2.5 py-1 text-xs font-bold tabular-nums text-rose-800 dark:text-rose-300">
                            <PackageX className="h-3 w-3" /> {s.lostBooksCount}
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--muted)]">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button type="button" onClick={() => openEditModal(s)}
                            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => openDeleteModal(s)}
                            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--card-border)] bg-[var(--background)]/30 px-5 py-3 text-xs text-[var(--muted)]">
              {searchQuery ? `${filtered.length} / ${students.length} öğrenci gösteriliyor` : `Toplam ${students.length} öğrenci`}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalMode && (
          <motion.div role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !busy && setModalMode(null)}
          >
            <motion.div role="dialog" aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    modalMode === "add" ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}>
                    {modalMode === "add" ? <UserPlus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {modalMode === "add" ? "Yeni Öğrenci Ekle" : "Öğrenci Düzenle"}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      {modalMode === "add" ? "Bilgileri girin ve kaydedin." : `${editTarget?.fullName} bilgilerini güncelleyin.`}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => !busy && setModalMode(null)}
                  className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--background)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                    Ad Soyad <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input required autoFocus
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-indigo-500/40 focus:ring-indigo-500/20"
                    placeholder="Öğrencinin adı ve soyadı"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Numara <span className="text-xs font-normal text-[var(--muted)]">(opsiyonel)</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-indigo-500/40 focus:ring-indigo-500/20"
                      placeholder="Örn: 1234"
                      value={studentNo} onChange={(e) => setStudentNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Sınıf <span className="text-xs font-normal text-[var(--muted)]">(opsiyonel)</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-indigo-500/40 focus:ring-indigo-500/20"
                      placeholder="Örn: 9-A"
                      value={gradeClass} onChange={(e) => setGradeClass(e.target.value)}
                    />
                  </div>
                </div>

                {formErr && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-sm text-[var(--danger)]">{formErr}</motion.p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button type="button" disabled={busy} onClick={() => setModalMode(null)}
                    className="rounded-xl border border-[var(--card-border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                  >
                    Vazgeç
                  </button>
                  <button type="submit" disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> {modalMode === "add" ? "Öğrenci Ekle" : "Güncelle"}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingDelete && (
          <motion.div role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !busy && setPendingDelete(null)}
          >
            <motion.div role="dialog" aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Öğrenciyi silmek istediğinize emin misiniz?</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <strong className="text-[var(--foreground)]">{pendingDelete.fullName}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>
              {pendingDelete.lostBooksCount > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                  <strong>Uyarı:</strong> Bu öğrencinin {pendingDelete.lostBooksCount} kayıp kitap kaydı var.
                </div>
              )}
              {deleteErr && <p className="mt-3 text-sm text-[var(--danger)]">{deleteErr}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={busy} onClick={() => setPendingDelete(null)}
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button type="button" disabled={busy} onClick={() => void confirmDelete()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                >
                  {deleting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Siliniyor…</>
                  ) : (
                    <><Trash2 className="h-4 w-4" /> Evet, sil</>
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
