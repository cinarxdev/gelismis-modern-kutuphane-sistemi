"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2, Search, User, BookOpen, ArrowRight, ArrowLeft, CheckCircle2,
  CalendarDays, Lock, ScanBarcode, Sparkles, UserCheck, BookMarked, Clock,
} from "lucide-react";

type Stu = { id: string; fullName: string; studentNo: string | null; gradeClass: string | null };
type Book = { id: string; title: string; author: string; barcode: string | null; isAvailable: boolean };
type Step = "student" | "book" | "done";

export default function OduncVerPage() {
  const [step, setStep] = React.useState<Step>("student");
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [school, setSchool] = React.useState<{
    defaultLoanDays: number; loanDaysLocked: boolean; barcodeEnabled: boolean;
  } | null>(null);

  const [studentQuery, setStudentQuery] = React.useState("");
  const [studentResults, setStudentResults] = React.useState<Stu[]>([]);
  const [studentLoading, setStudentLoading] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<Stu | null>(null);

  const [bookQuery, setBookQuery] = React.useState("");
  const [bookResults, setBookResults] = React.useState<Book[]>([]);
  const [bookLoading, setBookLoading] = React.useState(false);
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);

  const [loanDays, setLoanDays] = React.useState(14);
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [successDue, setSuccessDue] = React.useState<string | null>(null);

  const [defaultStudents, setDefaultStudents] = React.useState<Stu[]>([]);
  const [defaultBooks, setDefaultBooks] = React.useState<Book[]>([]);

  React.useEffect(() => {
    Promise.all([fetch("/api/auth/me").then((r) => r.json()), fetch("/api/school/settings").then((r) => r.json())]).then(
      ([me, sc]) => {
        if (me.user?.role) setUserRole(me.user.role);
        if (sc.school) {
          setSchool({ defaultLoanDays: sc.school.defaultLoanDays, loanDaysLocked: Boolean(sc.school.loanDaysLocked), barcodeEnabled: sc.school.barcodeEnabled });
          setLoanDays(sc.school.defaultLoanDays);
        }
      }
    );

    fetch("/api/students?limit=6")
      .then((r) => r.json())
      .then((d) => {
        if (d.students) setDefaultStudents(d.students);
      });
    fetch("/api/books?available=true&limit=6")
      .then((r) => r.json())
      .then((d) => {
        if (d.books) setDefaultBooks(d.books);
      });
  }, []);

  React.useEffect(() => {
    const q = studentQuery.trim();
    if (q.length < 2) { setStudentResults([]); setStudentLoading(false); return; }
    setStudentLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/students?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => { setStudentResults(Array.isArray(d.students) ? d.students : []); setStudentLoading(false); })
        .catch(() => { setStudentResults([]); setStudentLoading(false); });
    }, 220);
    return () => clearTimeout(t);
  }, [studentQuery]);

  React.useEffect(() => {
    const q = bookQuery.trim();
    if (q.length < 2) { setBookResults([]); setBookLoading(false); return; }
    setBookLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/books?available=true&q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => { setBookResults(Array.isArray(d.books) ? d.books : []); setBookLoading(false); })
        .catch(() => { setBookResults([]); setBookLoading(false); });
    }, 220);
    return () => clearTimeout(t);
  }, [bookQuery]);

  const isLocked = Boolean(school?.loanDaysLocked) && userRole !== "super_admin";
  const canEditLoanDays = !isLocked;

  function goBookStep() {
    if (!selectedStudent) return;
    setErr(""); setBookQuery(""); setBookResults([]); setSelectedBook(null);
    if (school) setLoanDays(school.defaultLoanDays);
    setStep("book");
  }
  function goStudentStep() { setStep("student"); setErr(""); }
  function resetFlow() {
    setStep("student"); setSelectedStudent(null); setSelectedBook(null);
    setStudentQuery(""); setStudentResults([]); setBookQuery(""); setBookResults([]);
    setErr(""); setSuccessDue(null);
    if (school) setLoanDays(school.defaultLoanDays);
  }

  async function submitLoan() {
    if (!selectedStudent || !selectedBook) return;
    setErr(""); setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent.id, bookId: selectedBook.id, loanDays: canEditLoanDays ? loanDays : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error ?? "İşlem başarısız"); return; }
      setSuccessDue(new Date(data.loan.dueDate).toLocaleDateString("tr-TR", { dateStyle: "long" }));
      setStep("done");
    } finally { setSubmitting(false); }
  }

  const stepperItems = [
    { id: "student" as const, label: "Öğrenci", icon: User },
    { id: "book" as const, label: "Kitap", icon: BookOpen },
  ];

  return (
    <>
      <HeaderBar title="Kitap Ödünç Ver" subtitle="Öğrenci ve kitap seçerek hızlı ödünç işlemi" />
      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-3.5">
          {stepperItems.map((s, i) => {
            const active = step === s.id;
            const done = (s.id === "student" && (step === "book" || step === "done")) || (s.id === "book" && step === "done");
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <div className={`h-0.5 w-8 rounded-full transition-colors ${done || active ? "bg-indigo-500" : "bg-[var(--card-border)]"}`} />}
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    active ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" :
                    done ? "bg-indigo-600 text-white" :
                    "border border-[var(--card-border)] text-[var(--muted)]"
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm font-medium ${active ? "text-indigo-600 dark:text-indigo-400" : done ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                    {s.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
          <div className="ml-auto text-xs font-medium text-[var(--muted)]">
            Adım {step === "student" ? 1 : step === "book" ? 2 : 2}/2
          </div>
        </div>

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card)] py-16 text-center"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-9 w-9" />
            </motion.div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Ödünç kaydedildi</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Son teslim: <strong className="text-[var(--foreground)]">{successDue}</strong>
            </p>
            <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 px-6 py-3 text-sm">
              <p className="font-medium text-[var(--foreground)]">{selectedBook?.title}</p>
              <p className="text-[var(--muted)]">{selectedBook?.author}</p>
              <p className="mt-1 text-[var(--muted)]">→ {selectedStudent?.fullName}</p>
            </div>
            <motion.button type="button" onClick={resetFlow} whileTap={{ scale: 0.99 }}
              className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-8 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-indigo-500/40"
            >
              Yeni ödünç işlemi
            </motion.button>
          </motion.div>
        )}

        {step !== "done" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[3fr_2fr]">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm">
              <AnimatePresence mode="wait">
                {step === "student" && (
                  <motion.div key="student" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }} className="p-5 sm:p-6"
                  >
                    <div className="mb-5 flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)]">Öğrenci seçin</h2>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">Ad, numara veya sınıf için en az 2 harf yazın.</p>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      <input autoFocus
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] py-3 pl-11 pr-4 text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-indigo-500/40 focus:ring-indigo-500/20"
                        placeholder="Öğrenci ara…" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)}
                      />
                      {studentLoading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />}
                    </div>

                    <div className="mt-4 max-h-[min(55vh,480px)] space-y-1.5 overflow-y-auto rounded-xl border border-[var(--card-border)]/80 bg-[var(--background)]/40 p-2">
                      {studentQuery.trim().length < 2 && studentResults.length === 0 && defaultStudents.length > 0 && (
                        <div className="mb-2 px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]/60">Öğrenciler</div>
                      )}
                      {studentQuery.trim().length < 2 && studentResults.length === 0 && defaultStudents.length === 0 && !studentLoading && (
                        <p className="py-12 text-center text-sm text-[var(--muted)]">Yükleniyor...</p>
                      )}
                      {(studentQuery.trim().length < 2 ? defaultStudents : studentResults).map((s, idx) => (
                        <motion.button key={s.id} type="button"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.35) }}
                          onClick={() => setSelectedStudent(s)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            selectedStudent?.id === s.id
                              ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                              : "border-transparent bg-[var(--card)] hover:border-[var(--card-border)]"
                          }`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            selectedStudent?.id === s.id ? "bg-indigo-500/20 text-indigo-500" : "bg-[var(--background)] text-[var(--muted)]"
                          }`}>
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-[var(--foreground)]">{s.fullName}</span>
                            <span className="block truncate text-xs text-[var(--muted)]">
                              {[s.gradeClass, s.studentNo].filter(Boolean).join(" · ") || "—"}
                            </span>
                          </div>
                          {selectedStudent?.id === s.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />}
                        </motion.button>
                      ))}
                    </div>

                    <motion.button type="button" disabled={!selectedStudent} onClick={goBookStep}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                      whileHover={selectedStudent ? { scale: 1.01 } : {}} whileTap={selectedStudent ? { scale: 0.99 } : {}}
                    >
                      Devam et <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                )}

                {step === "book" && (
                  <motion.div key="book" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }} className="p-5 sm:p-6"
                  >
                    <button type="button" onClick={goStudentStep}
                      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <ArrowLeft className="h-4 w-4" /> Öğrenci seçimine dön
                    </button>

                    <div className="mb-5 flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)]">Kitap seçin</h2>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">Barkod, kitap adı veya yazar ile arayın. Yalnızca müsait kitaplar listelenir.</p>
                      </div>
                    </div>

                    <div className="relative">
                      {school?.barcodeEnabled
                        ? <ScanBarcode className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                        : <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      }
                      <input autoFocus
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] py-3 pl-11 pr-4 text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-violet-500/40 focus:ring-violet-500/20"
                        placeholder={school?.barcodeEnabled ? "Barkod veya kitap adı…" : "Kitap adı veya yazar…"}
                        value={bookQuery} onChange={(e) => setBookQuery(e.target.value)}
                      />
                      {bookLoading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500" />}
                    </div>

                    <div className="mt-4 max-h-[min(55vh,480px)] space-y-1.5 overflow-y-auto rounded-xl border border-[var(--card-border)]/80 bg-[var(--background)]/40 p-2">
                      {bookQuery.trim().length < 2 && bookResults.length === 0 && defaultBooks.length > 0 && (
                        <div className="mb-2 px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]/60">Müsait Kitaplar</div>
                      )}
                      {bookQuery.trim().length < 2 && bookResults.length === 0 && defaultBooks.length === 0 && !bookLoading && (
                        <p className="py-12 text-center text-sm text-[var(--muted)]">Yükleniyor...</p>
                      )}
                      {(bookQuery.trim().length < 2 ? defaultBooks : bookResults).map((b, idx) => (
                        <motion.button key={b.id} type="button"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.025, 0.3) }}
                          onClick={() => setSelectedBook(b)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            selectedBook?.id === b.id
                              ? "border-violet-500 bg-violet-500/10 shadow-sm"
                              : "border-transparent bg-[var(--card)] hover:border-[var(--card-border)]"
                          }`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            selectedBook?.id === b.id ? "bg-violet-500/20 text-violet-500" : "bg-[var(--background)] text-[var(--muted)]"
                          }`}>
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-[var(--foreground)]">{b.title}</span>
                            <span className="block truncate text-sm text-[var(--muted)]">{b.author}</span>
                            {b.barcode && <span className="block truncate font-mono text-xs text-[var(--muted)]">Barkod: {b.barcode}</span>}
                          </div>
                          {selectedBook?.id === b.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-500" />}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <UserCheck className="h-3.5 w-3.5" /> Seçilen Öğrenci
                </div>
                {selectedStudent ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 dark:bg-indigo-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-500">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{selectedStudent.fullName}</p>
                        <p className="text-sm text-[var(--muted)]">{[selectedStudent.gradeClass, selectedStudent.studentNo].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--background)]/40 px-4 py-6 text-center">
                    <User className="mx-auto h-6 w-6 text-[var(--muted)] opacity-40" />
                    <p className="mt-2 text-xs text-[var(--muted)]">Henüz seçilmedi</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <BookMarked className="h-3.5 w-3.5" /> Seçilen Kitap
                </div>
                {selectedBook ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 dark:bg-violet-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-500">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--foreground)]">{selectedBook.title}</p>
                        <p className="truncate text-sm text-[var(--muted)]">{selectedBook.author}</p>
                        {selectedBook.barcode && <p className="mt-0.5 truncate font-mono text-xs text-[var(--muted)]">Barkod: {selectedBook.barcode}</p>}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--background)]/40 px-4 py-6 text-center">
                    <BookOpen className="mx-auto h-6 w-6 text-[var(--muted)] opacity-40" />
                    <p className="mt-2 text-xs text-[var(--muted)]">{step === "student" ? "Önce öğrenci seçin" : "Henüz seçilmedi"}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <Clock className="h-3.5 w-3.5" /> Ödünç Süresi
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  Süre (gün)
                  {isLocked && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                      <Lock className="h-3 w-3" /> Kilitli
                    </span>
                  )}
                </div>
                <input type="number" min={1} max={365} disabled={!canEditLoanDays}
                  className="mt-3 w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                  value={loanDays} onChange={(e) => setLoanDays(Math.min(365, Math.max(1, Number(e.target.value) || 1)))}
                />
                {isLocked && (
                  <p className="mt-2 text-xs text-[var(--muted)]">Yönetici varsayılan süreyi kilitlemiş; yalnızca {school?.defaultLoanDays} gün uygulanır.</p>
                )}
              </div>

              {step === "book" && (
                <div className="mt-2 space-y-3">
                  {err && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-[var(--danger)]">{err}</motion.p>
                  )}
                  <motion.button type="button" disabled={!selectedBook || submitting}
                    onClick={() => void submitLoan()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    whileHover={selectedBook && !submitting ? { scale: 1.01 } : {}}
                    whileTap={selectedBook && !submitting ? { scale: 0.99 } : {}}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ödünç ver
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
