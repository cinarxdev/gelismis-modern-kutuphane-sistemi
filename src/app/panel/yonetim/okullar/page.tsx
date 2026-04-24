"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import { Loader2, Plus } from "lucide-react";

type SchoolRow = {
  id: string;
  name: string;
  schoolType: string;
  barcodeEnabled: boolean;
  defaultLoanDays: number;
  createdAt: string;
  stats?: { users: number; books: number; students: number };
};

const types: Record<string, string> = {
  ilkokul: "İlkokul",
  ortaokul: "Ortaokul",
  lise: "Lise",
  diger: "Diğer",
};

export default function OkullarPage() {
  const [schools, setSchools] = React.useState<SchoolRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    schoolType: "ortaokul" as SchoolRow["schoolType"],
    barcodeEnabled: true,
    defaultLoanDays: 14,
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
    staffUsername: "",
    staffPassword: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/schools");
    const data = await res.json();
    if (data.schools) setSchools(data.schools);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    const res = await fetch("/api/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(data.error ?? "Oluşturulamadı");
      return;
    }
    setOpen(false);
    setForm({
      name: "",
      schoolType: "ortaokul",
      barcodeEnabled: true,
      defaultLoanDays: 14,
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
      staffUsername: "",
      staffPassword: "",
    });
    load();
  }

  return (
    <>
      <HeaderBar title="Okullar" subtitle="Yeni okul ve ilk hesaplar" />
      <div className="p-6">
        <div className="mb-6 flex justify-end">
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Okul Ekle
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {schools.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">{s.name}</h3>
                    <p className="text-sm text-[var(--muted)]">{types[s.schoolType] ?? s.schoolType}</p>
                  </div>
                  <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {s.barcodeEnabled ? "Barkodlu" : "Barkodsuz"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Varsayılan ödünç: <strong className="text-[var(--foreground)]">{s.defaultLoanDays}</strong> gün
                </p>
                {s.stats && (
                  <div className="mt-4 flex gap-4 text-xs text-[var(--muted)]">
                    <span>Hesap: {s.stats.users}</span>
                    <span>Kitap: {s.stats.books}</span>
                    <span>Öğrenci: {s.stats.students}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.form
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={onCreate}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
              >
                <h3 className="mb-4 text-lg font-semibold">Yeni Okul</h3>
                <div className="space-y-3">
                  <input
                    required
                    placeholder="Okul adı"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <select
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.schoolType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, schoolType: e.target.value as SchoolRow["schoolType"] }))
                    }
                  >
                    {Object.entries(types).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.barcodeEnabled}
                      onChange={(e) => setForm((f) => ({ ...f, barcodeEnabled: e.target.checked }))}
                    />
                    Barkodlu sistem
                  </label>
                  <div>
                    <label className="text-sm text-[var(--muted)]">Varsayılan ödünç süresi (gün)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                      value={form.defaultLoanDays}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, defaultLoanDays: Number(e.target.value) || 14 }))
                      }
                    />
                  </div>
                  <p className="border-t border-[var(--card-border)] pt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Okul yöneticisi (müdür)
                  </p>
                  <input
                    required
                    placeholder="Kullanıcı adı"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.adminUsername}
                    onChange={(e) => setForm((f) => ({ ...f, adminUsername: e.target.value }))}
                  />
                  <input
                    required
                    type="email"
                    placeholder="E-posta"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.adminEmail}
                    onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  />
                  <input
                    required
                    type="password"
                    placeholder="Şifre"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.adminPassword}
                    onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                  />
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">İlk görevli</p>
                  <input
                    required
                    placeholder="Görevli kullanıcı adı"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.staffUsername}
                    onChange={(e) => setForm((f) => ({ ...f, staffUsername: e.target.value }))}
                  />
                  <input
                    required
                    type="password"
                    placeholder="Görevli şifre"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5"
                    value={form.staffPassword}
                    onChange={(e) => setForm((f) => ({ ...f, staffPassword: e.target.value }))}
                  />
                </div>
                {err && <p className="mt-3 text-sm text-[var(--danger)]">{err}</p>}
                <div className="mt-6 flex gap-2">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Oluştur"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-[var(--card-border)] px-4 py-3"
                  >
                    İptal
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
