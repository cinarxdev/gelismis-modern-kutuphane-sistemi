"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderBar } from "@/components/panel/header-bar";
import {
  Loader2, CheckCircle2, XCircle, Clock, Building2, MapPin,
  Mail, Phone, User, Globe, FileText, ChevronDown, ChevronUp,
} from "lucide-react";

type Application = {
  id: string; schoolName: string; schoolType: string; studentCount: number; bookCountRange: string;
  il: string; ilce: string; adres: string;
  contactName: string; contactRole: string; contactEmail: string; contactPhone: string;
  website: string; notes: string; status: string; createdAt: string;
};

const typeLabel: Record<string, string> = { ilkokul: "İlkokul", ortaokul: "Ortaokul", lise: "Lise", diger: "Diğer" };

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  beklemede: { label: "Beklemede", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Clock },
  onaylandi: { label: "Onaylandı", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  reddedildi: { label: "Reddedildi", cls: "bg-red-500/15 text-red-600 dark:text-red-400", icon: XCircle },
};

function AppCard({ app, onAction }: { app: Application; onAction: (id: string, status: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const sc = statusConfig[app.status] ?? statusConfig.beklemede;
  const StatusIcon = sc.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <h3 className="truncate text-base font-semibold text-[var(--foreground)]">{app.schoolName}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>{typeLabel[app.schoolType] ?? app.schoolType}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-[var(--accent)]">{app.bookCountRange} Kitap</span>
            <span>•</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.il}, {app.ilce}</span>
            <span>•</span>
            <span>{new Date(app.createdAt).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${sc.cls}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {sc.label}
        </span>
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {open ? "Detayları Gizle" : "Detayları Gör"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="mt-4 grid gap-3 border-t border-[var(--card-border)] pt-4 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-[var(--muted)]"><User className="h-3.5 w-3.5" /><span className="text-[var(--foreground)]">{app.contactName}</span>{app.contactRole && <span>({app.contactRole})</span>}</div>
              <div className="flex items-center gap-2 text-[var(--muted)]"><Mail className="h-3.5 w-3.5" /><span className="text-[var(--foreground)]">{app.contactEmail}</span></div>
              <div className="flex items-center gap-2 text-[var(--muted)]"><Phone className="h-3.5 w-3.5" /><span className="text-[var(--foreground)]">{app.contactPhone}</span></div>
              {app.studentCount > 0 && <div className="flex items-center gap-2 text-[var(--muted)]">Öğrenci: <span className="text-[var(--foreground)]">{app.studentCount}</span></div>}
              {app.bookCountRange && <div className="flex items-center gap-2 text-[var(--muted)]">Kitap: <span className="text-[var(--foreground)]">{app.bookCountRange}</span></div>}
              {app.adres && <div className="flex items-start gap-2 text-[var(--muted)] sm:col-span-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="text-[var(--foreground)]">{app.adres}</span></div>}
              {app.website && <div className="flex items-center gap-2 text-[var(--muted)] sm:col-span-2"><Globe className="h-3.5 w-3.5" /><a href={app.website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">{app.website}</a></div>}
              {app.notes && <div className="flex items-start gap-2 text-[var(--muted)] sm:col-span-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="text-[var(--foreground)]">{app.notes}</span></div>}
            </div>

            {app.status === "beklemede" && (
              <div className="mt-4 flex gap-2 border-t border-[var(--card-border)] pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onAction(app.id, "onaylandi")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md">
                  <CheckCircle2 className="h-4 w-4" /> Onayla
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onAction(app.id, "reddedildi")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" /> Reddet
                </motion.button>
              </div>
            )}

            {app.status !== "beklemede" && (
              <div className={`mt-4 rounded-xl px-4 py-2.5 text-center text-sm font-medium ${sc.cls}`}>
                Bu başvuru {app.status === "onaylandi" ? "onaylandı" : "reddedildi"}.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BasvurularPage() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/applications");
    const data = await res.json().catch(() => ({}));
    if (data.applications) setApps(data.applications);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, []);

  async function handleAction(id: string, status: string) {
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      setToast(status === "onaylandi" ? "Başvuru onaylandı" : "Başvuru reddedildi");
      setTimeout(() => setToast(""), 3000);
    }
  }

  const pending = apps.filter((a) => a.status === "beklemede").length;

  return (
    <>
      <HeaderBar title="Okul Başvuruları" subtitle={`${apps.length} başvuru${pending ? ` · ${pending} beklemede` : ""}`} />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Building2 className="mb-3 h-12 w-12 text-[var(--muted)]/40" />
            <p className="text-lg font-semibold text-[var(--foreground)]">Henüz başvuru yok</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Okullar başvuru formunu doldurduğunda burada görünecek.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{apps.map((a) => <AppCard key={a.id} app={a} onAction={handleAction} />)}</div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
