"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from "lucide-react";

const iller = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin",
  "Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale",
  "Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum",
  "Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin",
  "İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli",
  "Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş",
  "Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas",
  "Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat",
  "Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın",
  "Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce",
];

const schoolTypes: Record<string, string> = {
  ilkokul: "İlkokul",
  ortaokul: "Ortaokul",
  lise: "Lise",
  diger: "Diğer",
};

type FormData = {
  schoolName: string; schoolType: string; studentCount: string; bookCountRange: string;
  il: string; ilce: string; adres: string;
  contactName: string; contactRole: string; contactEmail: string; contactPhone: string;
  website: string; notes: string;
};

const initial: FormData = {
  schoolName: "", schoolType: "ortaokul", studentCount: "", bookCountRange: "",
  il: "", ilce: "", adres: "",
  contactName: "", contactRole: "", contactEmail: "", contactPhone: "",
  website: "", notes: "",
};

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_3px_var(--accent)/0.08] placeholder:text-[var(--muted)]/50";
const selectCls = inputCls + " premium-select";

export default function BasvuruPage() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormData>(initial);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isReady = 
    form.schoolName.trim() && 
    form.il && 
    form.ilce.trim() && 
    form.adres.trim() && 
    form.bookCountRange && 
    form.contactName.trim() && 
    form.contactEmail.trim() && 
    form.contactPhone.trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isReady) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, studentCount: Number(form.studentCount) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Bir hata oluştu"); return; }
      setSuccess(true);
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex max-w-md flex-col items-center text-center">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]/15">
            <CheckCircle2 className="h-10 w-10 text-[var(--success)]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Başvurunuz Alındı!</h1>
          <p className="mt-3 text-[var(--muted)]">Bilgileriniz platform yöneticisine iletildi. En kısa sürede değerlendirilecektir.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push("/giris")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--accent)]/20">
            <ArrowLeft className="h-4 w-4" /> Giriş Sayfasına Dön
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">

      <div className="mx-auto max-w-3xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Okul Başvuru Formu</h1>
            <p className="mt-2 text-[var(--muted)]">Platformumuza katılmak için bilgilerinizi doldurun.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <Building2 className="h-5 w-5 text-[var(--accent)]" /> Okul Bilgileri
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Okul Adı *" icon={Building2}>
                  <input className={inputCls} placeholder="Atatürk Ortaokulu" value={form.schoolName} onChange={set("schoolName")} required />
                </Field>
                <Field label="Okul Türü *" icon={GraduationCap}>
                  <select className={selectCls} value={form.schoolType} onChange={set("schoolType")}>
                    {Object.entries(schoolTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Öğrenci Sayısı" icon={User}>
                  <input type="number" className={inputCls} placeholder="350" value={form.studentCount} onChange={set("studentCount")} />
                </Field>
                <Field label="Ortalama Kitap Sayısı *" icon={BookOpen}>
                  <select className={selectCls} value={form.bookCountRange} onChange={set("bookCountRange")} required>
                    <option value="">Seçin</option>
                    <option value="0-1000">0 – 1.000</option>
                    <option value="1001-3000">1.001 – 3.000</option>
                    <option value="3001-6000">3.001 – 6.000</option>
                    <option value="6001-9000">6.001 – 9.000</option>
                    <option value="9001+">9.001+</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <MapPin className="h-5 w-5 text-[var(--chart-2)]" /> Konum Bilgileri
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="İl *" icon={MapPin}>
                  <select className={selectCls} value={form.il} onChange={set("il")} required>
                    <option value="">İl seçin</option>
                    {iller.map((il) => <option key={il} value={il}>{il}</option>)}
                  </select>
                </Field>
                <Field label="İlçe *" icon={MapPin}>
                  <input className={inputCls} placeholder="İlçe adı" value={form.ilce} onChange={set("ilce")} required />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Adres *" icon={MapPin}>
                    <input className={inputCls} placeholder="Açık adres" value={form.adres} onChange={set("adres")} required />
                  </Field>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <Phone className="h-5 w-5 text-[var(--success)]" /> İletişim Bilgileri
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad Soyad *" icon={User}>
                  <input className={inputCls} placeholder="Ahmet Yılmaz" value={form.contactName} onChange={set("contactName")} required />
                </Field>
                <Field label="Görev / Ünvan" icon={User}>
                  <input className={inputCls} placeholder="Müdür Yardımcısı" value={form.contactRole} onChange={set("contactRole")} />
                </Field>
                <Field label="E-posta *" icon={Mail}>
                  <input type="email" className={inputCls} placeholder="ornek@okul.edu.tr" value={form.contactEmail} onChange={set("contactEmail")} required />
                </Field>
                <Field label="Telefon *" icon={Phone}>
                  <input type="tel" className={inputCls} placeholder="05XX XXX XX XX" value={form.contactPhone} onChange={set("contactPhone")} required />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Web Sitesi" icon={Globe}>
                    <input className={inputCls} placeholder="https://okul.meb.gov.tr (opsiyonel)" value={form.website} onChange={set("website")} />
                  </Field>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <FileText className="h-5 w-5 text-[var(--warning)]" /> Ek Notlar
              </h2>
              <textarea className={inputCls + " min-h-[100px] resize-y"} placeholder="Eklemek istediğiniz bilgiler... (opsiyonel)"
                value={form.notes} onChange={set("notes")} />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--danger)]">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading || !isReady}
              initial={false}
              animate={{ opacity: isReady ? 1 : 0.4, scale: isReady ? 1 : 0.98 }}
              whileHover={isReady && !loading ? { scale: 1.01 } : {}}
              whileTap={isReady && !loading ? { scale: 0.99 } : {}}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[var(--accent)] py-4 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 disabled:cursor-not-allowed disabled:shadow-none">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…</> : "Başvuruyu Gönder"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
